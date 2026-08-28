import type { PoolClient } from "pg";
import { generateId } from "@/shared/utils/id";
import { formatReais } from "@/shared/utils/format";
import { findItem } from "@/models/data/items";
import { sellerNet } from "@/models/rules/bazaar";
import { enhancedName } from "@/models/rules/forge";
import * as bazaarController from "@/controllers/bazaar.controller";
import * as storeController from "@/controllers/store.controller";
import { lockListing, logSale, settleSale } from "@/models/repositories/server/bazaar.store";
import { loadGame, recordWalletMovement, saveGame } from "@/models/repositories/server/game.store";
import { refundPayment, type StripeSession } from "./stripe";

export interface FulfillOutcome {
  ok: boolean;
  message: string;
}

async function claim(client: PoolClient, session: StripeSession): Promise<boolean> {
  const kind = session.metadata.kind ?? "";
  const characterId = session.metadata.characterId ?? "";
  const reference = session.metadata.packId ?? session.metadata.listingId ?? null;
  const claimed = await client.query(
    `insert into stripe_payments (id, kind, character_id, reference_id, amount_cents)
     values ($1, $2, $3, $4, $5)
     on conflict (id) do nothing`,
    [session.id, kind, characterId, reference, session.amount_total ?? 0],
  );
  return (claimed.rowCount ?? 0) > 0;
}

export async function fulfillSession(
  client: PoolClient,
  session: StripeSession,
): Promise<FulfillOutcome> {
  if (session.payment_status !== "paid") {
    return { ok: false, message: "O pagamento ainda não foi confirmado pelo Stripe." };
  }
  const userId = session.metadata.userId ?? "";
  const characterId = session.metadata.characterId ?? "";
  if (!userId || !characterId) {
    return { ok: false, message: "Sessão de pagamento sem dono conhecido." };
  }

  const loaded = await loadGame(client, userId, true);
  if (!loaded || loaded.characterId !== characterId) {
    if (session.payment_intent) await refundPayment(session.payment_intent);
    return { ok: false, message: "A partida deste pagamento não existe mais: valor devolvido." };
  }

  if (!(await claim(client, session))) {
    return { ok: true, message: "Pagamento já creditado." };
  }

  if (session.metadata.kind === "store") {
    const result = storeController.purchasePack(loaded.state, session.metadata.packId ?? "");
    if (!result.ok || !result.data) {
      if (session.payment_intent) await refundPayment(session.payment_intent);
      return { ok: false, message: result.message };
    }
    await saveGame(client, characterId, loaded.state, result.state);
    await client.query(
      `insert into store_purchases (id, character_id, pack_id, price_cents, bronze_granted)
       values ($1, $2, $3, $4, $5)
       on conflict (id) do nothing`,
      [session.id, characterId, result.data.pack.id, result.data.pack.priceCents, result.data.bronze],
    );
    return { ok: true, message: result.message };
  }

  if (session.metadata.kind === "bazaar") {
    const quantity = Math.max(1, Math.min(999, Number(session.metadata.quantity ?? 1) || 1));
    const listing = await lockListing(client, session.metadata.listingId ?? "");
    if (!listing || listing.quantity < quantity) {
      if (session.payment_intent) await refundPayment(session.payment_intent);
      return {
        ok: false,
        message: "O anúncio saiu do quadro antes do pagamento chegar: valor devolvido.",
      };
    }
    const result = bazaarController.purchaseListing(loaded.state, listing, quantity);
    if (!result.ok || !result.data) {
      if (session.payment_intent) await refundPayment(session.payment_intent);
      return { ok: false, message: result.message + " Valor devolvido." };
    }
    const total = result.data.totalCents;
    const net = sellerNet(total);
    const buyerName = loaded.state.character?.name ?? "";
    await saveGame(client, characterId, loaded.state, result.state);
    await settleSale(client, listing, quantity, buyerName, net);
    await recordWalletMovement(client, listing.sellerId, net, "bazaar_sale", listing.id);
    const item = findItem(listing.itemId);
    await logSale(
      client,
      generateId("log"),
      listing.sellerId,
      buyerName +
        " levou " +
        enhancedName(item?.name ?? listing.itemId, listing.enhancement) +
        (quantity > 1 ? " x" + quantity : "") +
        " por " +
        formatReais(total) +
        ". No Alforje, já sem a taxa da casa: " +
        formatReais(net) +
        ".",
    );
    return { ok: true, message: result.message };
  }

  return { ok: false, message: "Tipo de pagamento desconhecido." };
}
