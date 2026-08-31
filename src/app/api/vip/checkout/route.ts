import { failure, success } from "@/models/entities/result";
import { hasVipSubscription, VIP_PRICE_CENTS } from "@/models/rules/vip";
import { createSubscriptionSession } from "../../_lib/stripe";
import { withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, async (state, _body, context) => {
    if (state.character && hasVipSubscription(state.character)) {
      return failure(state, "Você já tem uma assinatura VIP. Gerencie nas configurações.");
    }
    const origin = new URL(request.url).origin;
    try {
      const session = await createSubscriptionSession({
        name: "VIP Wizold - assinatura mensal",
        amountCents: VIP_PRICE_CENTS,
        metadata: {
          kind: "vip",
          userId: context.userId,
          characterId: context.characterId,
        },
        successUrl: origin + "/store?session_id={CHECKOUT_SESSION_ID}",
        cancelUrl: origin + "/store",
      });
      if (!session.url) return failure(state, "O Stripe não abriu o checkout. Tente de novo.");
      await context.client.query(
        `insert into store_purchases (id, character_id, pack_id, price_cents, bronze_granted, status)
         values ($1, $2, 'vip', $3, 0, 'opened')
         on conflict (id) do nothing`,
        [session.id, context.characterId, VIP_PRICE_CENTS],
      );
      return success(state, "", { url: session.url });
    } catch (error) {
      console.error("[api] POST /api/vip/checkout", error);
      return failure(state, "O Stripe não abriu o checkout. Tente de novo.");
    }
  });
}
