import { NextResponse } from "next/server";
import { readActivity, updateActivityProgress } from "@/models/repositories/server/game.store";
import { asInt, asText, readBody, withIdentity } from "../../_lib/api";

export async function PATCH(request: Request) {
  return withIdentity(request, async (identity, client) => {
    const body = await readBody(request);
    const beat = Math.max(0, asInt(body.beat, 0));
    const cooldownUntil = asText(body.cooldownUntil, 40) || null;
    await updateActivityProgress(client, identity.id, { beat, cooldownUntil });
    const { activity } = await readActivity(client, identity.id);
    return NextResponse.json({ ok: true, message: "", data: null, activity });
  });
}
