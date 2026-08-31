import type { PoolClient } from "pg";
import { generateId } from "@/shared/utils/id";
import { formatReais } from "@/shared/utils/format";
import { findItem } from "@/models/data/items";
import { findPack } from "@/models/data/store-packs";
import { sellerNet } from "@/models/rules/bazaar";
import { enhancedName } from "@/models/rules/forge";
import * as bazaarController from "@/controllers/bazaar.controller";
import * as storeController from "@/controllers/store.controller";
import { lockListing, logSale, settleSale } from "@/models/repositories/server/bazaar.store";
import { loadGame, recordWalletMovement, saveGame } from "@/models/repositories/server/game.store";
import {
  refundPayment,
  retrieveSubscription,
  type StripeSession,
  type StripeSubscription,
} from "./stripe";
import { VIP_DAYS, VIP_PRICE_CENTS } from "@/models/rules/vip";

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

async function returnMoney(
  client: PoolClient,
  session: StripeSession,
  characterId: string | null,
): Promise<string> {
  if (session.payment_intent && (await refundPayment(session.payment_intent))) {
    return "valor devolvido";
  }
  if (characterId && session.amount_total && session.amount_total > 0) {
    await client.query("update wallets set cents = cents + $2 where character_id = $1", [
      characterId,
      session.amount_total,
    ]);
    await recordWalletMovement(client, characterId, session.amount_total, "adjustment", session.id);
    return "valor creditado no Alforje";
  }
  return "procure o suporte para a devolução";
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
    if (!(await claim(client, session))) {
      return { ok: true, message: "Pagamento já tratado." };
    }
    if (session.payment_intent) await refundPayment(session.payment_intent);
    return { ok: false, message: "A partida deste pagamento não existe mais: valor devolvido." };
  }

  if (!(await claim(client, session))) {
    return { ok: true, message: "Pagamento já creditado." };
  }

  if (session.currency !== "brl") {
    const returned = await returnMoney(client, session, characterId);
    return { ok: false, message: "Pagamento em moeda estranha ao jogo: " + returned + "." };
  }

  if (session.metadata.kind === "store") {
    const pack = findPack(session.metadata.packId ?? "");
    if (!pack || session.amount_total !== pack.priceCents) {
      const returned = await returnMoney(client, session, characterId);
      return { ok: false, message: "Pagamento não bate com o pacote: " + returned + "." };
    }
    const result = storeController.purchasePack(loaded.state, pack.id);
    if (!result.ok || !result.data) {
      const returned = await returnMoney(client, session, characterId);
      await client.query(
        "update store_purchases set status = 'refunded', settled_at = now() where id = $1",
        [session.id],
      );
      return { ok: false, message: result.message + " " + returned + "." };
    }
    await saveGame(client, characterId, loaded.state, result.state);
    await client.query(
      `insert into store_purchases (id, character_id, pack_id, price_cents, bronze_granted, status, settled_at)
       values ($1, $2, $3, $4, $5, 'approved', now())
       on conflict (id) do update set
         bronze_granted = excluded.bronze_granted, status = 'approved', settled_at = now()`,
      [session.id, characterId, pack.id, pack.priceCents, result.data.bronze],
    );
    return { ok: true, message: result.message };
  }

  if (session.metadata.kind === "vip") {
    const subscriptionId = session.subscription;
    if (!subscriptionId) {
      const returned = await returnMoney(client, session, characterId);
      return { ok: false, message: "Assinatura VIP sem identificador: " + returned + "." };
    }
    const subscription = await retrieveSubscription(subscriptionId);
    const periodEnd =
      subscription && subscription.currentPeriodEnd > 0
        ? subscription.currentPeriodEnd * 1000
        : Date.now() + VIP_DAYS * 86_400_000;
    const result = storeController.applyVipSubscription(
      loaded.state,
      subscriptionId,
      periodEnd,
      subscription?.cancelAtPeriodEnd === true,
    );
    if (!result.ok || !result.data) {
      return { ok: false, message: result.message };
    }
    await saveGame(client, characterId, loaded.state, result.state);
    await client.query(
      `insert into store_purchases (id, character_id, pack_id, price_cents, bronze_granted, status, settled_at)
       values ($1, $2, 'vip', $3, 0, 'approved', now())
       on conflict (id) do update set status = 'approved', settled_at = now()`,
      [session.id, characterId, session.amount_total ?? VIP_PRICE_CENTS],
    );
    return { ok: true, message: result.message };
  }

  if (session.metadata.kind === "bazaar") {
    const quantity = Math.max(1, Math.min(999, Number(session.metadata.quantity ?? 1) || 1));
    const listing = await lockListing(client, session.metadata.listingId ?? "");
    if (!listing || listing.quantity < quantity) {
      const returned = await returnMoney(client, session, characterId);
      return {
        ok: false,
        message: "O anúncio saiu do quadro antes do pagamento chegar: " + returned + ".",
      };
    }
    if (session.amount_total !== listing.priceCents * quantity) {
      const returned = await returnMoney(client, session, characterId);
      return { ok: false, message: "Pagamento não bate com o anúncio: " + returned + "." };
    }
    const result = bazaarController.purchaseListing(loaded.state, listing, quantity);
    if (!result.ok || !result.data) {
      const returned = await returnMoney(client, session, characterId);
      return { ok: false, message: result.message + " " + returned + "." };
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

async function applySubscriptionState(
  client: PoolClient,
  subscription: StripeSubscription,
  ended: boolean,
): Promise<FulfillOutcome> {
  const userId = subscription.metadata.userId ?? "";
  const characterId = subscription.metadata.characterId ?? "";
  if (!userId || !characterId) return { ok: true, message: "Assinatura sem dono conhecido." };

  const loaded = await loadGame(client, userId, true);
  if (!loaded || loaded.characterId !== characterId) {
    return { ok: true, message: "Partida deste pagamento não encontrada." };
  }

  if (ended) {
    if ((loaded.state.character?.vipSubscriptionId ?? "") !== subscription.id) {
      return { ok: true, message: "Assinatura já substituída." };
    }
    const result = storeController.endVipSubscription(loaded.state);
    if (!result.ok) return { ok: false, message: result.message };
    await saveGame(client, characterId, loaded.state, result.state);
    return { ok: true, message: result.message };
  }

  const periodEnd =
    subscription.currentPeriodEnd > 0
      ? subscription.currentPeriodEnd * 1000
      : Date.now() + VIP_DAYS * 86_400_000;
  const result = storeController.applyVipSubscription(
    loaded.state,
    subscription.id,
    periodEnd,
    subscription.cancelAtPeriodEnd,
  );
  if (!result.ok) return { ok: false, message: result.message };
  await saveGame(client, characterId, loaded.state, result.state);
  return { ok: true, message: result.message };
}

export async function fulfillInvoice(
  client: PoolClient,
  subscriptionId: string,
): Promise<FulfillOutcome> {
  const subscription = await retrieveSubscription(subscriptionId);
  if (!subscription) return { ok: false, message: "Assinatura não encontrada no Stripe." };
  return applySubscriptionState(client, subscription, false);
}

export async function fulfillSubscriptionEnded(
  client: PoolClient,
  subscription: StripeSubscription,
): Promise<FulfillOutcome> {
  return applySubscriptionState(client, subscription, true);
}
