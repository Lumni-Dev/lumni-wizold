import * as inventoryController from "@/controllers/inventory.controller";
import { readActivity } from "@/models/repositories/server/game.store";
import { asInt, asText, withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    // The job slot is the server's answer, not the caller's: a tab that hides
    // its own dock, or one that simply lies, still meets the same refusal,
    // and the read rides the transaction withGame already locked.
    const { activity } = await readActivity(context.client, context.characterId);
    return inventoryController.equipItem(
      state,
      asText(body.itemId, 60),
      asInt(body.enhancement, 0),
      activity,
    );
  });
}
