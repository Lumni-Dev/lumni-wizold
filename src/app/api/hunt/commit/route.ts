import * as huntController from "@/controllers/hunt.controller";
import { failure } from "@/models/entities/result";
import { interruptRest } from "@/models/repositories/server/game.store";
import { takeHunt } from "@/models/repositories/server/hunt-hold";
import { withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, async (state, _body, context) => {
    const resolution = takeHunt(context.characterId);
    if (!resolution) return failure(state, "Caçada expirada; comece outra.");
    const landed = huntController.landHunt(state, resolution, 0);
    if (landed.ok) await interruptRest(context.client, context.characterId);
    return landed;
  });
}
