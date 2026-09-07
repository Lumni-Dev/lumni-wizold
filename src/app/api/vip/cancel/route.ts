import { failure } from "@/models/entities/result";
import { setVipCanceling } from "@/controllers/store.controller";
import { setSubscriptionCancel } from "../../_lib/stripe";
import { withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, async (state) => {
    const subscriptionId = state.character?.vipSubscriptionId ?? "";
    if (subscriptionId === "") {
      return failure(state, "You have no active VIP subscription.");
    }
    try {
      const updated = await setSubscriptionCancel(subscriptionId, true);
      if (!updated || updated.cancelAtPeriodEnd !== true) {
        return failure(state, "Stripe did not confirm the cancellation. Try again.");
      }
    } catch (error) {
      console.error("[api] POST /api/vip/cancel", error);
      return failure(state, "Stripe did not confirm the cancellation. Try again.");
    }
    return setVipCanceling(state, true);
  });
}
