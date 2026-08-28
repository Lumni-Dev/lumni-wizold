import * as marketController from "@/controllers/market.controller";
import { asInt, asText, withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, (state, body) =>
    marketController.sellItem(state, asText(body.itemId, 60), asInt(body.quantity, 1)),
  );
}
