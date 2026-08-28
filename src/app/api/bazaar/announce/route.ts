import * as bazaarController from "@/controllers/bazaar.controller";
import { asInt, asText, withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, (state, body) =>
    bazaarController.announceListing(
      state,
      asText(body.itemId, 60),
      asInt(body.quantity, 0),
      asInt(body.priceCents, 0),
    ),
  );
}
