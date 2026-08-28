import { failure, success } from "@/models/entities/result";
import { findItem } from "@/models/data/items";
import { isEquippable } from "@/models/entities/item";
import { enhancedName } from "@/models/rules/forge";
import { loadOthersListings } from "@/models/repositories/server/bazaar.store";
import { createCheckoutSession } from "../../_lib/stripe";
import { asQuantity, asText, withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const listingId = asText(body.listingId, 80);
    const quantity = asQuantity(body.quantity);
    const listing = (await loadOthersListings(context.client, context.characterId)).find(
      (candidate) => candidate.id === listingId,
    );
    if (!listing) return failure(state, "Esse anúncio já saiu do quadro.");
    if (quantity > listing.quantity) {
      return failure(state, "Só restam " + listing.quantity + " nesse anúncio.");
    }
    const item = findItem(listing.itemId);
    if (!item) return failure(state, "Item desconhecido.");
    const level = state.character?.level ?? 1;
    if (isEquippable(item) && level < item.minLevel) {
      return failure(state, item.name + " exige NV. " + item.minLevel + ".");
    }
    const origin = new URL(request.url).origin;
    try {
      const session = await createCheckoutSession({
        name:
          enhancedName(item.name, listing.enhancement) +
          (quantity > 1 ? " x" + quantity : "") +
          " · Bazar Wizold",
        amountCents: listing.priceCents * quantity,
        metadata: {
          kind: "bazaar",
          userId: context.userId,
          characterId: context.characterId,
          listingId: listing.id,
          quantity: String(quantity),
        },
        successUrl: origin + "/bazaar?session_id={CHECKOUT_SESSION_ID}",
        cancelUrl: origin + "/bazaar",
      });
      if (!session.url) return failure(state, "O Stripe não abriu o checkout. Tente de novo.");
      return success(state, "", { url: session.url });
    } catch (error) {
      console.error("[api] POST /api/bazaar/checkout", error);
      return failure(state, "O Stripe não abriu o checkout. Tente de novo.");
    }
  });
}
