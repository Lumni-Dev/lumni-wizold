import { NextResponse } from "next/server";
import * as tavernController from "@/controllers/tavern.controller";
import { saveTavernDiff } from "@/models/repositories/server/tavern.store";
import { asText, withTavern } from "../../_lib/api";
import { hashSecret } from "../../_lib/session";

// Opens a table. The password never reaches a row in clear: it is hashed
// here and the controller state only ever carries "" (locked) or null (open).
export async function POST(request: Request) {
  return withTavern(request, async (state, body, context) => {
    const password = asText(body.password, 60);
    const result = tavernController.createRoom(
      state,
      context.identity,
      asText(body.name, 40),
      password,
    );

    if (result.ok && result.roomId) {
      const newHashes = new Map<string, string>();
      if (password.trim().length > 0) newHashes.set(result.roomId, hashSecret(password.trim()));
      await saveTavernDiff(context.client, state, result.state, context.tavern.hashes, newHashes);
    }

    return NextResponse.json({
      ok: result.ok,
      message: result.message,
      data: result.roomId ? { roomId: result.roomId } : null,
    });
  }, { write: true });
}
