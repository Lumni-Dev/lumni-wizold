import * as huntController from "@/controllers/hunt.controller";
import { success } from "@/models/entities/result";
import { holdHunt, peekHunt } from "@/models/repositories/server/hunt-hold";
import { asText, withGame } from "../_lib/api";
export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    let resolution = peekHunt(context.characterId);
    if (!resolution) {
      const resolved = huntController.resolveHunt(
        state,
        asText(body.territoryId, 60),
        undefined,
        asText(body.creatureId, 60),
      );
      if (!resolved.ok || !resolved.data) return resolved;
      resolution = resolved.data;
      holdHunt(context.characterId, resolution);
    }
    const preview = huntController.landHunt(state, resolution, 0);
    if (!preview.ok || !preview.data) return preview;
    return success(state, preview.message, preview.data);
  });
}
