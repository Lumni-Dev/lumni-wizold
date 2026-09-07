import { BAZAAR_LISTING_DAYS, isListingExpired } from "@/models/entities/bazaar";
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
    if (!listing) return failure(state, "That listing already left the board.");
    if (isListingExpired(listing)) {
      return failure(
        state,
        "That listing expired: the bazaar keeps each offer for " + BAZAAR_LISTING_DAYS + " days.",
      );
    }
    if (quantity > listing.quantity) {
      return failure(state, "Only " + listing.quantity + " left in that listing.");
    }
    const item = findItem(listing.itemId);
    if (!item) return failure(state, "Unknown item.");
    const level = state.character?.level ?? 1;
    if (isEquippable(item) && level < item.minLevel) {
      return failure(state, item.name + " exige NV. " + item.minLevel + ".");
    }
    const origin = new URL(request.url).origin;
    const order = {
      name:
        enhancedName(item.name, listing.enhancement) +
        (quantity > 1 ? " x" + quantity : "") +
        " - Bazar Wizold",
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
    };
    try {
      const session = await createCheckoutSession(order);
      if (!session.url) return failure(state, "Stripe did not open the checkout. Try again.");
      return success(state, "", { url: session.url });
    } catch (error) {
      console.error("[api] POST /api/bazaar/checkout", error);
      return failure(state, "Stripe did not open the checkout. Try again.");
    }
  });
}
