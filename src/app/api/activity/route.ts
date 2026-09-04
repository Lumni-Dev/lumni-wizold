import { NextResponse } from "next/server";
import { isActivityKind } from "@/models/entities/activity";
import { ACTIVITY_BEAT_MAX, ACTIVITY_LAPS_MAX } from "@/shared/constants/game";
import { readActivity, updateActivity } from "@/models/repositories/server/game.store";
import { asInt, asText, readBody, withActivityLock } from "../_lib/api";

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

export async function PUT(request: Request) {
  return withActivityLock(request, async (client, characterId) => {
    const body = await readBody(request);
    const kind = asText(body.kind, 16);
    if (!kind) {
      await updateActivity(client, characterId, null);
      return NextResponse.json({ ok: true, message: "", data: null, activity: null });
    }
    if (!isActivityKind(kind)) {
      return NextResponse.json({ ok: false, message: "Atividade inválida.", data: null });
    }
    const resume = readResume(body);
    await updateActivity(client, characterId, {
      kind,
      targetId: asText(body.id, 120) || null,
      enhancement: typeof body.enhancement === "number" ? Math.round(body.enhancement) : null,
      paused: body.paused === true,
      beat: Math.min(ACTIVITY_BEAT_MAX, Math.max(0, asInt(body.beat, 0))),
      laps: Math.min(ACTIVITY_LAPS_MAX, Math.max(0, asInt(body.laps, 0))),
      cooldownUntil: asText(body.cooldownUntil, 40) || null,
      resumeKind: resume.resumeKind,
      resumeTargetId: resume.resumeTargetId,
      resumeEnhancement: resume.resumeEnhancement,
      startedAt: kind === "rest" ? new Date().toISOString() : null,
    });
    const { activity } = await readActivity(client, characterId);
    return NextResponse.json({ ok: true, message: "", data: null, activity });
  });
}
