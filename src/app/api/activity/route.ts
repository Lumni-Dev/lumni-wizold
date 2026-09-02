import { NextResponse } from "next/server";
import { isActivityKind } from "@/models/entities/activity";
import { updateActivity } from "@/models/repositories/server/game.store";
import { asText, readBody, withIdentity } from "../_lib/api";

export async function PUT(request: Request) {
  return withIdentity(request, async (identity, client) => {
    const body = await readBody(request);
    const kind = asText(body.kind, 16);
    if (!kind) {
      await updateActivity(client, identity.id, null);
      return NextResponse.json({ ok: true, message: "", data: null });
    }
    if (!isActivityKind(kind)) {
      return NextResponse.json({ ok: false, message: "Atividade inválida.", data: null });
    }
    await updateActivity(client, identity.id, { kind });
    return NextResponse.json({ ok: true, message: "", data: null });
  });
}
