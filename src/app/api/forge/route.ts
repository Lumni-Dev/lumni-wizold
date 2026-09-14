import * as forgeController from "@/controllers/forge.controller";
import { failure } from "@/models/entities/result";
import { cooldownLeft, setCooldown } from "@/models/repositories/server/action-cooldown";
import { interruptRest } from "@/models/repositories/server/game.store";
import { FORGE_BASE_MS } from "@/shared/constants/game";
import { asInt, asText, withGame } from "../_lib/api";
import { demoGate, spendDemo } from "../_lib/demo";

export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const demo = await demoGate(context.client, context.userId, state, "forge");
    if (demo) return demo;
    if ((await cooldownLeft(context.client, context.characterId, "forge")) > 0) {
      return failure(state, "");
    }
    const result = forgeController.enhance(state, asText(body.itemId, 60), asInt(body.enhancement, 0));
    if (result.ok) {
      await interruptRest(context.client, context.characterId);
      await setCooldown(context.client, context.characterId, "forge", FORGE_BASE_MS);
      await spendDemo(context.client, context.userId, "forge");
    }
    return result;
  });
}
