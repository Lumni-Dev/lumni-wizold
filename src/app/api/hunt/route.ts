import * as huntController from "@/controllers/hunt.controller";
import { failure } from "@/models/entities/result";
import { cooldownLeft, setCooldown } from "@/models/repositories/server/action-cooldown";
import { interruptRest } from "@/models/repositories/server/game.store";
import { HUNT_TICK_MS } from "@/shared/constants/game";
import { asText, withGame } from "../_lib/api";
import { demoGate, spendDemo } from "../_lib/demo";
export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const demo = await demoGate(context.client, context.userId, state, "hunt");
    if (demo) return demo;
    if ((await cooldownLeft(context.client, context.characterId, "hunt")) > 0) {
      return failure(state, "");
    }
    const resolved = huntController.resolveHunt(
      state,
      asText(body.territoryId, 60),
      undefined,
      asText(body.creatureId, 60),
    );
    if (!resolved.ok || !resolved.data) return resolved;
    const landed = huntController.landHunt(state, resolved.data, 0);
    if (landed.ok && landed.data) {
      await interruptRest(context.client, context.characterId);
      await setCooldown(
        context.client,
        context.characterId,
        "hunt",
        landed.data.combat.rounds.length * HUNT_TICK_MS,
      );
      await spendDemo(context.client, context.userId, "hunt");
    }
    return landed;
  });
}
