import { NextResponse } from "next/server";
import * as tavernController from "@/controllers/tavern.controller";
import { saveTavernDiff } from "@/models/repositories/server/tavern.store";
import { asText, withTavern } from "../../../../_lib/api";
import { verifySecret } from "../../../../_lib/session";

// The hash check happens before the controller runs; a verified guest walks
// in with the "" sentinel that matches the loaded locked room.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withTavern(request, async (state, body, context) => {
    const roomId = id.slice(0, 80);
    const hash = context.tavern.hashes.get(roomId);
    const room = tavernController.findRoom(state, roomId);
    const seated = room?.members.some((member) => member.id === context.identity.id) === true;

    if (hash && !seated && !verifySecret(asText(body.password, 60).trim(), hash)) {
      return NextResponse.json({ ok: false, message: "Senha incorreta.", data: null });
    }

    const result = tavernController.joinRoom(state, roomId, context.identity, "");
    if (result.ok) {
      await saveTavernDiff(context.client, state, result.state, context.tavern.hashes);
    }

    return NextResponse.json({
      ok: result.ok,
      message: result.message,
      data: result.roomId ? { roomId: result.roomId } : null,
    });
  });
}
