import { REST_TICK_MS } from "@/shared/constants/game";
import * as characterController from "@/controllers/character.controller";
import { success } from "@/models/entities/result";
import { updateActivity } from "@/models/repositories/server/game.store";
import { withGame } from "../../_lib/api";
export async function POST(request: Request) {
  return withGame(request, async (state, _body, context) => {
    const result = characterController.startRest(state);
    if (result.ok) {
      await updateActivity(context.client, context.characterId, {
        kind: "rest",
        startedAt: new Date().toISOString(),
      });
    }
    return result;
  });
}
export async function PATCH(request: Request) {
  return withGame(request, async (state, _body, context) => {
    const startedAt = context.loaded.activityStartedAt;
    if (!startedAt || context.loaded.activityKind !== "rest") {
      return { ok: false, message: "Você não está repousando.", state };
    }
    const elapsed = Date.now() - Date.parse(startedAt);
    const entitled = Math.floor(elapsed / REST_TICK_MS);
    if (entitled <= 0) {
      return success(state, "", { done: false, ticks: 0, nextInMs: REST_TICK_MS - elapsed });
    }
    let current = state;
    let done = false;
    let ticks = 0;
    for (; ticks < entitled && !done; ticks += 1) {
      const tick = characterController.restTick(current);
      if (!tick.ok) break;
      current = tick.state;
      done = tick.data?.done === true;
    }
    if (done) {
      await updateActivity(context.client, context.characterId, null);
    } else {
      await updateActivity(context.client, context.characterId, {
        kind: "rest",
        startedAt: new Date(Date.parse(startedAt) + ticks * REST_TICK_MS).toISOString(),
      });
    }
    return success(current, "", { done, ticks, nextInMs: REST_TICK_MS });
  });
}
