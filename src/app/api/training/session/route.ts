import * as trainingController from "@/controllers/training.controller";
import { failure } from "@/models/entities/result";
import { cooldownLeft, setCooldown } from "@/models/repositories/server/action-cooldown";
import { interruptRest } from "@/models/repositories/server/game.store";
import { TRAINING_TICKS_MIN, TRAINING_TICK_MS } from "@/shared/constants/game";
import { asText, withGame } from "../../_lib/api";
export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    if ((await cooldownLeft(context.client, context.characterId, "train")) > 0) {
      return failure(state, "");
    }
    const result = trainingController.train(state, asText(body.exerciseId, 60));
    if (result.ok) {
      await interruptRest(context.client, context.characterId);
      await setCooldown(
        context.client,
        context.characterId,
        "train",
        TRAINING_TICKS_MIN * TRAINING_TICK_MS,
      );
    }
    return result;
  });
}
