import { NextResponse } from "next/server";
import * as tavernController from "@/controllers/tavern.controller";
import { commitTavernWrite } from "@/app/api/_lib/tavern-commit";
import { asText, withTavernRoom } from "../../../../_lib/api";
import { rateLimit, rateLimitShared } from "../../../../_lib/rate-limit";
import { verifySecret } from "../../../../_lib/session";
export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const { id } = await params;
  return withTavernRoom(request, id.slice(0, 80), async (state, body, context) => {
    const roomId = id.slice(0, 80);
    const hash = context.tavern.hashes.get(roomId);
    const room = tavernController.findRoom(state, roomId);
    const seated = room?.members.some((member) => member.id === context.identity.id) === true;
    if (hash && !seated) {
      const key = "tavern-pw:" + context.identity.id + ":" + roomId;
      if (!rateLimit(key, 6, 60000).allowed || !(await rateLimitShared(key, 6, 60))) {
        return NextResponse.json(
          { ok: false, message: "Senha errada demais. Espere um minuto.", data: null },
          { status: 429 },
        );
      }
      if (!verifySecret(asText(body.password, 60).trim(), hash)) {
        return NextResponse.json({ ok: false, message: "Senha incorreta.", data: null });
      }
    }
    const result = tavernController.joinRoom(state, roomId, context.identity, "");
    if (result.ok) {
      await commitTavernWrite(context.client, state, result.state, context.tavern.hashes);
    }
    return NextResponse.json({
      ok: result.ok,
      message: result.message,
      data: result.roomId ? { roomId: result.roomId } : null,
    });
  });
}
