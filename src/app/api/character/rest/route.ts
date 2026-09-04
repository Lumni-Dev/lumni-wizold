import { REST_TICK_MS } from "@/shared/constants/game";
import * as characterController from "@/controllers/character.controller";
import { isActivityKind } from "@/models/entities/activity";
import { success } from "@/models/entities/result";
import { updateActivity } from "@/models/repositories/server/game.store";
import { asText, withGame } from "../../_lib/api";

function readResume(body: Record<string, unknown>) {
  const resume = body.resume;
  if (typeof resume !== "object" || resume === null) {
    return { resumeKind: null, resumeTargetId: null, resumeEnhancement: null };
  }
  const row = resume as Record<string, unknown>;
  const kind = asText(row.kind, 16);
  return {
    resumeKind: isActivityKind(kind) ? kind : null,
    resumeTargetId: asText(row.id, 120) || null,
    resumeEnhancement: typeof row.enhancement === "number" ? Math.round(row.enhancement) : null,
  };
}

export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const result = characterController.startRest(state);
    if (result.ok) {
      const resume = readResume(body);
      await updateActivity(context.client, context.characterId, {
        kind: "rest",
        startedAt: new Date().toISOString(),
        beat: 0,
        cooldownUntil: null,
        resumeKind: resume.resumeKind,
        resumeTargetId: resume.resumeTargetId,
        resumeEnhancement: resume.resumeEnhancement,
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
    if (!Number.isFinite(elapsed)) {
      return success(state, "", { done: false, ticks: 0, nextInMs: REST_TICK_MS });
    }
    const entitled = Math.floor(elapsed / REST_TICK_MS);
    if (entitled <= 0) {
      return success(state, "", {
        done: false,
        ticks: 0,
        nextInMs: Math.max(250, REST_TICK_MS - elapsed),
      });
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
      const resume = context.loaded.activity?.resume;
      await updateActivity(context.client, context.characterId, {
        kind: "rest",
        startedAt: new Date(Date.parse(startedAt) + ticks * REST_TICK_MS).toISOString(),
        resumeKind: resume?.kind ?? null,
        resumeTargetId: resume?.id ?? null,
        resumeEnhancement: resume?.enhancement ?? null,
      });
    }
    const remainder = elapsed - ticks * REST_TICK_MS;
    const healed = (current.character?.health ?? 0) - (state.character?.health ?? 0);
    return success(current, "", {
      done,
      ticks,
      healed,
      nextInMs: Math.max(250, REST_TICK_MS - remainder),
    });
  });
}
