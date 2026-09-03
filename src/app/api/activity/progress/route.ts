import { NextResponse } from "next/server";
import { readActivity, updateActivityProgress } from "@/models/repositories/server/game.store";
import { asInt, asText, readBody, withActivityLock } from "../../_lib/api";

export async function PATCH(request: Request) {
  return withActivityLock(request, async (client, characterId) => {
    const body = await readBody(request);
    const beat = Math.max(0, asInt(body.beat, 0));
    const cooldownUntil = asText(body.cooldownUntil, 40) || null;
    await updateActivityProgress(client, characterId, { beat, cooldownUntil });
    const { activity } = await readActivity(client, characterId);
    return NextResponse.json({ ok: true, message: "", data: null, activity });
  });
}
