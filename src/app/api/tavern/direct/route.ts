import { NextResponse } from "next/server";
import * as tavernController from "@/controllers/tavern.controller";
import { saveTavernDiff } from "@/models/repositories/server/tavern.store";
import { asText, withTavern } from "../../_lib/api";
export async function POST(request: Request) {
  return withTavern(
    request,
    async (state, body, context) => {
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
      const mates = await context.client.query(
        "select 1 from pack_mates where character_id = $1 and mate_id = $2",
        [context.identity.id, otherId],
      );
      if (mates.rows.length === 0) {
        return NextResponse.json({
          ok: false,
          message:
            "Mesa reservada é só entre a matilha. Convide " + other.name + " e espere aceitar.",
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
    },
    { write: true },
  );
}
