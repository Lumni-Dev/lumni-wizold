import * as bazaarController from "@/controllers/bazaar.controller";
import { asQuantity, asText, withGame } from "../../_lib/api";
export async function POST(request: Request) {
  return withGame(request, (state, body) =>
    bazaarController.purchaseListing(state, asText(body.listingId, 80), asQuantity(body.quantity)),
  );
}
