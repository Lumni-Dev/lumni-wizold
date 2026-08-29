import * as huntController from "@/controllers/hunt.controller";
import { interruptRest } from "@/models/repositories/server/game.store";
import { asText, withGame } from "../_lib/api";
export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const resolved = huntController.resolveHunt(state, asText(body.territoryId, 60));
    if (!resolved.ok || !resolved.data) return resolved;
    const landed = huntController.landHunt(state, resolved.data, 0);
    if (landed.ok) await interruptRest(context.client, context.characterId);
    return landed;
  });
}
