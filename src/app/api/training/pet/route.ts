import * as petController from "@/controllers/pet.controller";
import { interruptRest } from "@/models/repositories/server/game.store";
import { withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, async (state, _body, context) => {
    const result = petController.trainPet(state);
    if (result.ok) await interruptRest(context.client, context.characterId);
    return result;
  });
}
