import * as bazaarController from "@/controllers/bazaar.controller";
import { asText, withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, (state, body) =>
    bazaarController.cancelListing(state, asText(body.listingId, 80)),
  );
}
