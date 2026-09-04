import { NextResponse } from "next/server";
import { ACTIVITY_BEAT_MAX } from "@/shared/constants/game";
import { readActivity, updateActivityProgress } from "@/models/repositories/server/game.store";
import { asInt, asText, readBody, withActivityLock } from "../../_lib/api";

export async function PATCH(request: Request) {
  return withActivityLock(request, async (client, characterId) => {
    const body = await readBody(request);
    const beat = Math.min(ACTIVITY_BEAT_MAX, Math.max(0, asInt(body.beat, 0)));
    const cooldownUntil = asText(body.cooldownUntil, 40) || null;
    const updated = await updateActivityProgress(client, characterId, { beat, cooldownUntil });
    if (!updated) {
      return NextResponse.json({ ok: true, message: "", data: null, activity: null });
    }
    const { activity } = await readActivity(client, characterId);
    return NextResponse.json({ ok: true, message: "", data: null, activity });
  });
}
