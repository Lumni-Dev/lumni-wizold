import * as bazaarController from "@/controllers/bazaar.controller";
import { asInt, asQuantity, asText, withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, (state, body) =>
    bazaarController.announceListing(
      state,
      asText(body.itemId, 60),
      asQuantity(body.quantity),
      asInt(body.priceCents, 0),
    ),
  );
}
