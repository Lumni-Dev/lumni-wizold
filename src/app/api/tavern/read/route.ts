import { NextResponse } from "next/server";
import { asText, readBody, withIdentity } from "../../_lib/api";
import { markTavernRead } from "@/models/repositories/server/tavern-user.store";

export async function PATCH(request: Request) {
  return withIdentity(request, async (identity, client) => {
    const body = await readBody(request);
    const roomId = asText(body.roomId, 80);
    const at = asText(body.at, 40);
    if (!roomId || !at) return NextResponse.json({ ok: false, message: "Sala inválida.", data: null });

    const alive = Array.isArray(body.alive)
      ? body.alive.filter((entry): entry is string => typeof entry === "string").slice(0, 40)
      : undefined;

    const read = await markTavernRead(client, identity.id, roomId, at, alive);
    return NextResponse.json({ ok: true, message: "", data: { read } });
  });
}
