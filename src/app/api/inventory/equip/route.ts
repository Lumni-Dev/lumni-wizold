import * as inventoryController from "@/controllers/inventory.controller";
import { asInt, asText, withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, (state, body) =>
    inventoryController.equipItem(state, asText(body.itemId, 60), asInt(body.enhancement, 0)),
  );
}
