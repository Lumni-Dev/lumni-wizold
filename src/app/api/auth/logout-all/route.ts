import { NextResponse } from "next/server";
import { withTransaction } from "@/models/repositories/server/database";
import { clearPresenceForUser } from "@/models/repositories/server/presence.store";
import { bad, refuseAbuse } from "../../_lib/api";
import { dropSession, sessionClaims } from "../../_lib/session";

export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  const claims = await sessionClaims();
  if (!claims) return bad("Entre para jogar.", 401);
  try {
    await withTransaction(async (client) => {
      await clearPresenceForUser(client, claims.userId);
      await client.query("update users set session_epoch = session_epoch + 1 where id = $1", [
        claims.userId,
      ]);
    });
    await dropSession();
    return NextResponse.json({
      ok: true,
      message: "Todos os aparelhos foram desconectados.",
      data: null,
    });
  } catch (error) {
    console.error("[api] POST /api/auth/logout-all", error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}
