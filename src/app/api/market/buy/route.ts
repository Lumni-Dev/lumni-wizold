import * as marketController from "@/controllers/market.controller";
import { asQuantity, asText, withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, (state, body) =>
    marketController.buyItem(state, asText(body.itemId, 60), asQuantity(body.quantity)),
  );
}
