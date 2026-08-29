import { failure, success } from "@/models/entities/result";
import { findPack } from "@/models/data/store-packs";
import { createCheckoutSession } from "../../_lib/stripe";
import { asText, withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const pack = findPack(asText(body.packId, 40));
    if (!pack) return failure(state, "Esse pacote não existe mais.");
    const origin = new URL(request.url).origin;
    try {
      const session = await createCheckoutSession({
        name: pack.name + " - Wizold",
        amountCents: pack.priceCents,
        metadata: {
          kind: "store",
          userId: context.userId,
          characterId: context.characterId,
          packId: pack.id,
        },
        successUrl: origin + "/store?session_id={CHECKOUT_SESSION_ID}",
        cancelUrl: origin + "/store",
      });
      if (!session.url) return failure(state, "O Stripe não abriu o checkout. Tente de novo.");
      await context.client.query(
        `insert into store_purchases (id, character_id, pack_id, price_cents, bronze_granted, status)
         values ($1, $2, $3, $4, 0, 'opened')
         on conflict (id) do nothing`,
        [session.id, context.characterId, pack.id, pack.priceCents],
      );
      return success(state, "", { url: session.url });
    } catch (error) {
      console.error("[api] POST /api/store/checkout", error);
      return failure(state, "O Stripe não abriu o checkout. Tente de novo.");
    }
  });
}
