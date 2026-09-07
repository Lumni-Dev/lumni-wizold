import { MAX_ENHANCEMENT } from "@/shared/constants/game";
import { formatBronze, formatReais } from "@/shared/utils/format";
import { generateId } from "@/shared/utils/id";
import { isValidQuantity } from "@/shared/utils/quantity";
import { findItem } from "@/models/data/items";
import { isListingExpired, type BazaarListing } from "@/models/entities/bazaar";
import type { GameState } from "@/models/entities/game-state";
import { isEquippable, type Item } from "@/models/entities/item";
import { failure, success, type Result } from "@/models/entities/result";
import {
  bazaarListingFee,
  checkTrade,
  MAX_LISTING_CENTS,
  MIN_LISTING_CENTS,
  MIN_WITHDRAW_CENTS,
  suggestedPriceCents,
} from "@/models/rules/bazaar";
import { enhancedName } from "@/models/rules/forge";
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
  expired: boolean;
}

export function listBoard(state: GameState, others: readonly BazaarListing[] = []): BoardEntry[] {
  const own = state.bazaarListings
    .map((listing) => ({
      listing,
      item: findItem(listing.itemId),
      mine: true,
      available: listing.quantity,
      expired: isListingExpired(listing),
    }))
    .filter((entry): entry is BoardEntry => Boolean(entry.item));

  const board = others
    .filter((listing) => !isListingExpired(listing))
    .map((listing) => ({
      listing,
      item: findItem(listing.itemId),
      mine: false,
      available: listing.quantity,
      expired: false,
    }))
    .filter((entry): entry is BoardEntry => Boolean(entry.item) && entry.available > 0);

  return [...own, ...board];
}

export function announceListing(
  state: GameState,
  itemId: string,
  quantity: number,
  priceCents: number,
  enhancement = 0,
): Result {
  const character = state.character;
  if (!character) return failure(state, "No active character.");

  const item = findItem(itemId);
  if (!item) return failure(state, "Unknown item.");

  const { tradable, reason } = checkTrade(item, enhancement);
  if (!tradable) return failure(state, reason ?? item.name + " does not enter the bazaar.");

  if (!isValidQuantity(quantity)) return failure(state, "Invalid quantity.");
  if (countInInventory(state.inventory, itemId, enhancement) < quantity) {
    return failure(state, "You do not have " + quantity + " of " + item.name + " in the bag.");
  }

  const cents = Math.round(priceCents);
  if (!Number.isFinite(cents) || cents < MIN_LISTING_CENTS) {
    return failure(state, "The minimum listing is " + formatReais(MIN_LISTING_CENTS) + ".");
  }
  if (cents > MAX_LISTING_CENTS) {
    return failure(
      state,
      "The board takes no listing above " + formatReais(MAX_LISTING_CENTS) + ".",
    );
  }

  const listingFee = bazaarListingFee(character.level);
  if (character.bronze < listingFee) {
    return failure(
      state,
      formatBronze(listingFee - character.bronze) +
        " short for the listing fee.",
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
    character: { ...character, bronze: character.bronze - listingFee },
    inventory: removeFromInventory(state.inventory, itemId, quantity, enhancement),
    bazaarListings: [...state.bazaarListings, listing],
  };

  const message =
    enhancedName(item.name, enhancement) +
    (quantity > 1 ? " x" + quantity : "") +
    " announced for " +
    formatReais(priceCents) +
    (quantity > 1 ? " each." : ".") +
    " Fee of " +
    formatBronze(listingFee) +
    " paid.";

  return success(addLog(next, "market", message), message);
}

export function cancelListing(state: GameState, listingId: string): Result {
  const listing = state.bazaarListings.find((candidate) => candidate.id === listingId);
  if (!listing) return failure(state, "That listing is not yours or already left the board.");

  const item = findItem(listing.itemId);
  if (!item) return failure(state, "The catalog no longer knows that item.");

  const next: GameState = {
    ...state,
    bazaarListings: state.bazaarListings.filter((candidate) => candidate.id !== listingId),
    inventory: addToInventory(
      state.inventory,
      listing.itemId,
      listing.quantity,
      listing.enhancement,
    ),
  };

  const message = "Listing removed: " + (item?.name ?? listing.itemId) + " returned to the bag.";

  return success(addLog(next, "market", message), message);
}

export function purchaseListing(
  state: GameState,
  listing: BazaarListing,
  quantity: number,
): Result<{ totalCents: number }> {
  const character = state.character;
  if (!character) return failure(state, "No active character.");

  if (
    listing.sellerId === character.id ||
    state.bazaarListings.some((candidate) => candidate.id === listing.id)
  ) {
    return failure(state, "The listing is yours: you cannot buy from yourself.");
  }

  if (!isValidQuantity(quantity)) return failure(state, "Invalid quantity.");
  if (quantity > listing.quantity) {
    return failure(state, "Only " + listing.quantity + " left in that listing.");
  }

  const item = findItem(listing.itemId);
  if (!item) return failure(state, "Unknown item.");
  if (isEquippable(item) && character.level < item.minLevel) {
    return failure(state, item.name + " demands LV. " + item.minLevel + ".");
  }

  const total = listing.priceCents * quantity;
  const carried = Math.min(MAX_ENHANCEMENT, listing.enhancement);

  const bought = state.bazaarPurchases[listing.id] ?? 0;
  const next: GameState = {
    ...state,
    inventory: addToInventory(state.inventory, listing.itemId, quantity, carried),
    bazaarPurchases: { ...state.bazaarPurchases, [listing.id]: bought + quantity },
    bazaarFinds: state.bazaarFinds.includes(listing.itemId)
      ? state.bazaarFinds
      : [...state.bazaarFinds, listing.itemId],
  };

  const message =
    enhancedName(item.name, listing.enhancement) +
    (quantity > 1 ? " x" + quantity : "") +
    " arrived from the bazaar: " +
    formatReais(total) +
    " paid at checkout.";

  return success(addLog(next, "market", message), message, { totalCents: total });
}

export function requestWithdraw(state: GameState, pixKey: string): Result {
  if (state.wallet.cents < MIN_WITHDRAW_CENTS) {
    return failure(
      state,
      "The minimum withdrawal is " + formatReais(MIN_WITHDRAW_CENTS) + ": gather more before asking.",
    );
  }
  if (pixKey.trim().length < 5) {
    return failure(state, "Enter a valid Pix key.");
  }

  const amount = state.wallet.cents;
  const next: GameState = { ...state, wallet: { cents: 0 } };
  const message =
    "Withdrawal of " +
    formatReais(amount) +
    " requested: the order was recorded, and in this version nothing is transferred yet.";

  return success(addLog(next, "market", message), message);
}
