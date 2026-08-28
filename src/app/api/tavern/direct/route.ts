import { NextResponse } from "next/server";
import * as tavernController from "@/controllers/tavern.controller";
import { saveTavernDiff } from "@/models/repositories/server/tavern.store";
import { asText, withTavern } from "../../_lib/api";

// A table reserved for two. The other seat must be a real character; the
// roster does not sit at the tavern.
export async function POST(request: Request) {
  return withTavern(request, async (state, body, context) => {
    const otherId = asText(body.otherId, 80);
    const found = await context.client.query("select id, name from characters where id = $1", [
      otherId,
    ]);
    const other = found.rows[0];
    if (!other) {
      return NextResponse.json({
        ok: false,
        message: "Esse caçador não passa pela taverna.",
        data: null,
      });
    }

    const result = tavernController.openDirect(state, context.identity, {
      id: other.id,
      name: other.name,
    });
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
