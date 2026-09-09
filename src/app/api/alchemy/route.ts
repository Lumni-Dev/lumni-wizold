import * as alchemyController from "@/controllers/alchemy.controller";
import { failure } from "@/models/entities/result";
import { cooldownLeft, setCooldown } from "@/models/repositories/server/action-cooldown";
import { interruptRest } from "@/models/repositories/server/game.store";
import { ALCHEMY_CYCLE_MS } from "@/shared/constants/game";
import { asText, withGame } from "../_lib/api";

export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    if ((await cooldownLeft(context.client, context.characterId, "alchemy")) > 0) {
      return failure(state, "");
    }
    const result = alchemyController.brewPotion(
      state,
      asText(body.potionId, 60),
      asText(body.first, 60),
      asText(body.second, 60),
    );
    if (result.ok) {
      await interruptRest(context.client, context.characterId);
      await setCooldown(context.client, context.characterId, "alchemy", ALCHEMY_CYCLE_MS);
    }
    return result;
  });
}
