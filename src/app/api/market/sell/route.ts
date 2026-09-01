import * as marketController from "@/controllers/market.controller";
import { asInt, asQuantity, asText, withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, (state, body) =>
    marketController.sellItem(
      state,
      asText(body.itemId, 60),
      asQuantity(body.quantity),
      asInt(body.enhancement, 0),
    ),
  );
}
