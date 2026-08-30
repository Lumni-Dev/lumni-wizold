import * as forgeController from "@/controllers/forge.controller";
import { interruptRest } from "@/models/repositories/server/game.store";
import { asText, withGame } from "../_lib/api";

export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const result = forgeController.enhance(state, asText(body.itemId, 60));
    if (result.ok) await interruptRest(context.client, context.characterId);
    return result;
  });
}
