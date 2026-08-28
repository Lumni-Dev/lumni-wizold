import * as inventoryController from "@/controllers/inventory.controller";
import { asText, withGame } from "../../_lib/api";

// Potions and pet rations share this door, exactly as consumeItem routes them.
export async function POST(request: Request) {
  return withGame(request, (state, body) =>
    inventoryController.consumeItem(state, asText(body.itemId, 60)),
  );
}
