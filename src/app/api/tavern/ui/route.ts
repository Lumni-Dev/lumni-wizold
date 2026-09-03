import { NextResponse } from "next/server";
import { asText, readBody, withIdentity } from "../../_lib/api";
import { saveTavernUi } from "@/models/repositories/server/tavern-user.store";

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function PATCH(request: Request) {
  return withIdentity(request, async (identity, client) => {
    const body = await readBody(request);
    const open = body.open === true;
    const roomId = open ? asText(body.roomId, 80) : null;
    const x = finite(body.x) ?? 0;
    const y = finite(body.y) ?? 0;

    if (open && !roomId) {
      return NextResponse.json({ ok: false, message: "Sala inválida.", data: null });
    }

    const ui = await saveTavernUi(client, identity.id, {
      roomId,
      open,
      x,
      y,
    });
    return NextResponse.json({ ok: true, message: "", data: { ui } });
  });
}
