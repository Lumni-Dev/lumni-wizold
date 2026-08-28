import * as bazaarController from "@/controllers/bazaar.controller";
import { asInt, asText, withGame } from "../../_lib/api";

// Buying from the roster board. The charge is still the labelled Pix
// simulation; when the payment API lands, its confirmation gates this call.
export async function POST(request: Request) {
  return withGame(request, (state, body) =>
    bazaarController.purchaseListing(state, asText(body.listingId, 80), asInt(body.quantity, 1)),
  );
}
