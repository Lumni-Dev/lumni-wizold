import * as huntController from "@/controllers/hunt.controller";
import { success } from "@/models/entities/result";
import { holdHunt } from "@/models/repositories/server/hunt-hold";
import { asText, withGame } from "../_lib/api";
export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const resolved = huntController.resolveHunt(
      state,
      asText(body.territoryId, 60),
      undefined,
      asText(body.creatureId, 60),
    );
    if (!resolved.ok || !resolved.data) return resolved;
    const preview = huntController.landHunt(state, resolved.data, 0);
    if (!preview.ok || !preview.data) return preview;
    holdHunt(context.characterId, resolved.data);
    return success(state, preview.message, preview.data);
  });
}
