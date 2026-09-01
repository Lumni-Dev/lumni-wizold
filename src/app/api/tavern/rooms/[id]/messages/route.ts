import { NextResponse } from "next/server";
import * as tavernController from "@/controllers/tavern.controller";
import { MESSAGE_MAX_LENGTH } from "@/models/entities/tavern";
import { commitTavernWrite } from "../../../../_lib/tavern-commit";
import { asText, withTavernRoom } from "../../../../_lib/api";
import { moderationRefusal } from "../../../../_lib/moderation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withTavernRoom(request, id.slice(0, 80), async (state, body, context) => {
    const text = asText(body.text, MESSAGE_MAX_LENGTH);
    const blocked = await moderationRefusal(context.client, context.userId, text, "chat_message");
    if (blocked) {
      return NextResponse.json({ ok: false, message: blocked, data: null });
    }
    const result = tavernController.sendMessage(
      state,
      id.slice(0, 80),
      context.identity,
      text,
    );
    if (result.ok) {
      const room = result.state.rooms.find((entry) => entry.id === id.slice(0, 80));
      const last = room?.messages[room.messages.length - 1];
      await commitTavernWrite(context.client, state, result.state, context.tavern.hashes, undefined, room && last ? {
        roomId: room.id,
        roomName: room.name,
        authorCharacterId: context.identity.id,
        authorName: context.identity.name,
        text: last.text,
        at: last.at,
      } : undefined);
    }
    return NextResponse.json({ ok: result.ok, message: result.message, data: null });
  });
}
