import { NextResponse } from "next/server";
import { parsePresenceStatus } from "@/models/rules/presence";
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
    return NextResponse.json({ ok: true, message: "", data: null });
  });
}
