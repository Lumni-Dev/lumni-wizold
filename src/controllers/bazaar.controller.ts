import { MAX_ENHANCEMENT } from "@/shared/constants/game";
import { formatReais } from "@/shared/utils/format";
import { generateId } from "@/shared/utils/id";
import { isValidQuantity } from "@/shared/utils/quantity";
import { findItem } from "@/models/data/items";
import type { BazaarListing } from "@/models/entities/bazaar";
import type { GameState } from "@/models/entities/game-state";
import { isEquippable, type Item } from "@/models/entities/item";
import { failure, success, type Result } from "@/models/entities/result";
import {
  checkTrade,
  MAX_LISTING_CENTS,
  MIN_LISTING_CENTS,
  MIN_WITHDRAW_CENTS,
  suggestedPriceCents,
} from "@/models/rules/bazaar";
import { enhancedName, enhancementOf } from "@/models/rules/forge";
import {
  addToInventory,
  countInInventory,
  detailInventory,
  removeFromInventory,
} from "./inventory.controller";
import { addLog } from "./log.controller";

export interface SellableEntry {
  item: Item;
  quantity: number;
  enhancement: number;
  suggestedCents: number;
}

export function listSellable(state: GameState): SellableEntry[] {
  return detailInventory(state)
    .filter(({ item, enhancement }) => checkTrade(item, enhancement).tradable)
    .map(({ item, quantity, enhancement }) => ({
      item,
      quantity,
      enhancement,
      suggestedCents: suggestedPriceCents(item, enhancement),
    }))
    .sort((first, second) => second.suggestedCents - first.suggestedCents);
}

export interface BoardEntry {
  listing: BazaarListing;
  item: Item;
  mine: boolean;
  available: number;
}

export function listBoard(state: GameState, others: readonly BazaarListing[] = []): BoardEntry[] {
  const own = state.bazaarListings
    .map((listing) => ({
      listing,
      item: findItem(listing.itemId),
      mine: true,
      available: listing.quantity,
    }))
    .filter((entry): entry is BoardEntry => Boolean(entry.item));

  const board = others
    .map((listing) => ({
      listing,
      item: findItem(listing.itemId),
      mine: false,
      available: listing.quantity,
    }))
    .filter((entry): entry is BoardEntry => Boolean(entry.item) && entry.available > 0);

  return [...own, ...board];
}

export function announceListing(
  state: GameState,
  itemId: string,
  quantity: number,
  priceCents: number,
): Result {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const item = findItem(itemId);
  if (!item) return failure(state, "Item desconhecido.");

  const enhancement = enhancementOf(state.enhancements, itemId);
  const { tradable, reason } = checkTrade(item, enhancement);
  if (!tradable) return failure(state, reason ?? item.name + " não entra no bazar.");

  if (!isValidQuantity(quantity)) return failure(state, "Quantidade inválida.");
  if (countInInventory(state.inventory, itemId) < quantity) {
    return failure(state, "Você não tem " + quantity + " de " + item.name + " na mochila.");
  }

  const cents = Math.round(priceCents);
  if (!Number.isFinite(cents) || cents < MIN_LISTING_CENTS) {
    return failure(state, "O anúncio mínimo é " + formatReais(MIN_LISTING_CENTS) + ".");
  }
  if (cents > MAX_LISTING_CENTS) {
    return failure(
      state,
      "O quadro não aceita anúncio acima de " + formatReais(MAX_LISTING_CENTS) + ".",
    );
  }

  const listing: BazaarListing = {
    id: generateId("listing"),
    sellerId: character.id,
    sellerName: character.name,
    itemId,
    enhancement,
    quantity,
    priceCents: cents,
    announcedAt: new Date().toISOString(),
  };

  const next: GameState = {
    ...state,
    inventory: removeFromInventory(state.inventory, itemId, quantity),
    bazaarListings: [...state.bazaarListings, listing],
  };

  const message =
    enhancedName(item.name, enhancement) +
    (quantity > 1 ? " x" + quantity : "") +
    " anunciado por " +
    formatReais(priceCents) +
    (quantity > 1 ? " cada." : ".");

  return success(addLog(next, "market", message), message);
}

export function cancelListing(state: GameState, listingId: string): Result {
  const listing = state.bazaarListings.find((candidate) => candidate.id === listingId);
  if (!listing) return failure(state, "Esse anúncio não é seu ou já saiu do quadro.");

  const item = findItem(listing.itemId);
  if (!item) return failure(state, "O catálogo não reconhece mais esse item.");

  const next: GameState = {
    ...state,
    bazaarListings: state.bazaarListings.filter((candidate) => candidate.id !== listingId),
    inventory: addToInventory(state.inventory, listing.itemId, listing.quantity),
  };

  const message = "Anúncio removido: " + (item?.name ?? listing.itemId) + " voltou para a mochila.";

  return success(addLog(next, "market", message), message);
}

export function purchaseListing(
  state: GameState,
  listing: BazaarListing,
  quantity: number,
): Result<{ totalCents: number }> {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  if (
    listing.sellerId === character.id ||
    state.bazaarListings.some((candidate) => candidate.id === listing.id)
  ) {
    return failure(state, "O anúncio é seu: não dá para comprar de si mesmo.");
  }

  if (!isValidQuantity(quantity)) return failure(state, "Quantidade inválida.");
  if (quantity > listing.quantity) {
    return failure(state, "Só restam " + listing.quantity + " nesse anúncio.");
  }

  const item = findItem(listing.itemId);
  if (!item) return failure(state, "Item desconhecido.");
  if (isEquippable(item) && character.level < item.minLevel) {
    return failure(state, item.name + " exige NV. " + item.minLevel + ".");
  }

  const total = listing.priceCents * quantity;
  if (state.wallet.cents < total) {
    return failure(
      state,
      "O Alforje não cobre " + formatReais(total) + ": venda algo ou carregue-o antes.",
    );
  }

  const carried = Math.min(MAX_ENHANCEMENT, listing.enhancement);
  const current = enhancementOf(state.enhancements, listing.itemId);
  const enhancements =
    carried > current ? { ...state.enhancements, [listing.itemId]: carried } : state.enhancements;

  const bought = state.bazaarPurchases[listing.id] ?? 0;
  const next: GameState = {
    ...state,
    inventory: addToInventory(state.inventory, listing.itemId, quantity),
    bazaarPurchases: { ...state.bazaarPurchases, [listing.id]: bought + quantity },
    enhancements,
    wallet: { cents: state.wallet.cents - total },
  };

  const message =
    enhancedName(item.name, listing.enhancement) +
    (quantity > 1 ? " x" + quantity : "") +
    " chegou do bazar por " +
    formatReais(total) +
    ", pago pelo Alforje.";

  return success(addLog(next, "market", message), message, { totalCents: total });
}

export function requestWithdraw(state: GameState, pixKey: string): Result {
  if (state.wallet.cents < MIN_WITHDRAW_CENTS) {
    return failure(
      state,
      "O saque mínimo é " + formatReais(MIN_WITHDRAW_CENTS) + ": junte mais antes de pedir.",
    );
  }
  if (pixKey.trim().length < 5) {
    return failure(state, "Informe uma chave Pix válida.");
  }

  const amount = state.wallet.cents;
  const next: GameState = { ...state, wallet: { cents: 0 } };
  const message =
    "Saque de " +
    formatReais(amount) +
    " solicitado (simulação): cai na conta quando a API de pagamento entrar.";

  return success(addLog(next, "market", message), message);
}
