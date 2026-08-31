import { failure } from "@/models/entities/result";
import { setVipCanceling } from "@/controllers/store.controller";
import { setSubscriptionCancel } from "../../_lib/stripe";
import { withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, async (state) => {
    const subscriptionId = state.character?.vipSubscriptionId ?? "";
    if (subscriptionId === "") {
      return failure(state, "Você não tem uma assinatura VIP ativa.");
    }
    try {
      const updated = await setSubscriptionCancel(subscriptionId, false);
      if (!updated) return failure(state, "O Stripe não confirmou a reativação. Tente de novo.");
    } catch (error) {
      console.error("[api] POST /api/vip/reactivate", error);
      return failure(state, "O Stripe não confirmou a reativação. Tente de novo.");
    }
    return setVipCanceling(state, false);
  });
}
