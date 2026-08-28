import * as inventoryController from "@/controllers/inventory.controller";
import { asInt, asText, withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, (state, body) =>
    inventoryController.discardItem(state, asText(body.itemId, 60), asInt(body.quantity, 1)),
  );
}
