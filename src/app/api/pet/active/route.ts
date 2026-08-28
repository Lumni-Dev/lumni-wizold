import * as petController from "@/controllers/pet.controller";
import { setPetRestCollectedAt } from "@/models/repositories/server/game.store";
import { withGame } from "../../_lib/api";
export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const active = body.active === true;
    const result = petController.setPetActive(state, active);
    if (result.ok) {
      await setPetRestCollectedAt(
        context.client,
        context.characterId,
        active ? null : new Date().toISOString(),
      );
    }
    return result;
  });
}
