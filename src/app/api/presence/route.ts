import { NextResponse } from "next/server";
import { isActivityKind } from "@/models/entities/activity";
import { parsePresenceStatus } from "@/models/rules/presence";
import { updateActivity } from "@/models/repositories/server/game.store";
import { touchPresence } from "@/models/repositories/server/presence.store";
import { asText, readBody, withIdentity } from "../_lib/api";

export async function PATCH(request: Request) {
  return withIdentity(request, async (identity, client) => {
    const body = await readBody(request);
    const status = parsePresenceStatus(asText(body.status, 16));
    if (status !== "active" && status !== "away") {
      return NextResponse.json({ ok: false, message: "Presença inválida.", data: null });
    }
    await touchPresence(client, identity.id, status);
    if ("activity" in body) {
      const kind = asText(body.activity, 16);
      if (!kind) await updateActivity(client, identity.id, null);
      else if (isActivityKind(kind)) await updateActivity(client, identity.id, { kind });
    }
    return NextResponse.json({ ok: true, message: "", data: null });
  });
}
