import { NextResponse } from "next/server";
import { withTransaction } from "@/models/repositories/server/database";
import { loadGame } from "@/models/repositories/server/game.store";
import { bad, sessionIsLive } from "../../_lib/api";
import { sessionClaims } from "../../_lib/session";

export async function GET() {
  const claims = await sessionClaims();
  if (!claims) return bad("Sem sessão.", 401);
  const userId = claims.userId;

  try {
    return await withTransaction(async (client) => {
      if (!(await sessionIsLive(client, claims))) return bad("Sessão encerrada.", 401);
      const found = await client.query("select email, picture from users where id = $1", [userId]);
      const loaded = await loadGame(client, userId, false);
      return NextResponse.json({
        ok: true,
        message: "",
        data: {
          userId,
          email: found.rows[0]?.email ?? null,
          picture: found.rows[0]?.picture ?? null,
          hasCharacter: loaded !== null,
        },
      });
    });
  } catch (error) {
    console.error("[api] GET /api/auth/me", error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}
