import { NextResponse } from "next/server";
import * as tavernController from "@/controllers/tavern.controller";
import { commitTavernWrite } from "@/app/api/_lib/tavern-commit";
import { asText, withTavern } from "../../_lib/api";
import { hashSecret } from "../../_lib/session";
import { moderationRefusal } from "../../_lib/moderation";

export async function POST(request: Request) {
  return withTavern(
    request,
    async (state, body, context) => {
      const name = asText(body.name, 40);
      const blocked = await moderationRefusal(context.client, context.userId, name, "room_name");
      if (blocked) {
        return NextResponse.json({ ok: false, message: blocked, data: null });
      }
      const password = asText(body.password, 60);
      const result = tavernController.createRoom(
        state,
        context.identity,
        name,
        password,
      );
      if (result.ok && result.roomId) {
        const newHashes = new Map<string, string>();
        if (password.trim().length > 0) newHashes.set(result.roomId, hashSecret(password.trim()));
        await commitTavernWrite(context.client, state, result.state, context.tavern.hashes, newHashes);
      }
      return NextResponse.json({
        ok: result.ok,
        message: result.message,
        data: result.roomId ? { roomId: result.roomId } : null,
      });
    },
    { write: true },
  );
}
