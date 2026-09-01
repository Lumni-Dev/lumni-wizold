import { NextResponse } from "next/server";
import { withTransaction } from "@/models/repositories/server/database";
import { clearPresenceForUser } from "@/models/repositories/server/presence.store";
import { dropSession, sessionClaims } from "../../_lib/session";
import { refuseAbuse } from "../../_lib/api";

export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  const claims = await sessionClaims();
  if (claims) {
    try {
      await withTransaction(async (client) => {
        await clearPresenceForUser(client, claims.userId);
      });
    } catch (error) {
      console.error("[api] POST /api/auth/logout presence", error);
    }
  }
  await dropSession();
  return NextResponse.json({ ok: true, message: "Sessão encerrada.", data: null });
}
