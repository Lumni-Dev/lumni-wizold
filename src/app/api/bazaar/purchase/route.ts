import { generateId } from "@/shared/utils/id";
import { formatReais } from "@/shared/utils/format";
import { findItem } from "@/models/data/items";
import { failure } from "@/models/entities/result";
import { sellerNet } from "@/models/rules/bazaar";
import { enhancedName } from "@/models/rules/forge";
import {
  lockListing,
  logSale,
  settleSale,
} from "@/models/repositories/server/bazaar.store";
import { recordWalletMovement } from "@/models/repositories/server/game.store";
import * as bazaarController from "@/controllers/bazaar.controller";
import { asQuantity, asText, withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const listingId = asText(body.listingId, 80);
    const quantity = asQuantity(body.quantity);
    const listing = await lockListing(context.client, listingId);
    if (!listing) return failure(state, "Esse anúncio já saiu do quadro.");

    const result = bazaarController.purchaseListing(state, listing, quantity);
    if (!result.ok || !result.data) return result;

    const total = result.data.totalCents;
    const net = sellerNet(total);
    const buyerName = state.character?.name ?? "";
    await settleSale(context.client, listing, quantity, buyerName, net);
    await recordWalletMovement(context.client, listing.sellerId, net, "bazaar_sale", listing.id);
    await recordWalletMovement(
      context.client,
      context.characterId,
      -total,
      "bazaar_purchase",
      listing.id,
    );
    const item = findItem(listing.itemId);
    await logSale(
      context.client,
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
    return result;
  });
}
