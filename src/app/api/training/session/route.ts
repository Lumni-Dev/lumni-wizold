import * as trainingController from "@/controllers/training.controller";
import { interruptRest } from "@/models/repositories/server/game.store";
import { asText, withGame } from "../../_lib/api";
export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const result = trainingController.train(state, asText(body.exerciseId, 60));
    if (result.ok) await interruptRest(context.client, context.characterId);
    return result;
  });
}
