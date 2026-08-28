import { generateId } from "@/shared/utils/id";
import * as storeController from "@/controllers/store.controller";
import { asText, withGame } from "../../_lib/api";

// The one paid door. The Pix here is still the labelled simulation: when the
// payment API lands, its confirmation becomes the gate in front of this call,
// and the purchase row below is the receipt trail it will reconcile against.
export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const result = storeController.purchasePack(state, asText(body.packId, 40));
    if (result.ok && result.data) {
      await context.client.query(
        `insert into store_purchases (id, character_id, pack_id, price_cents, bronze_granted)
         values ($1, $2, $3, $4, $5)`,
        [
          generateId("sp"),
          context.characterId,
          result.data.pack.id,
          result.data.pack.priceCents,
          result.data.bronze,
        ],
      );
    }
    return result;
  });
}
