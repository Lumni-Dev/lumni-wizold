import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { withTransaction } from "@/models/repositories/server/database";
import { bad, refuseAbuse, sessionIsLive } from "../../_lib/api";
import { sendDeletionCodeEmail } from "../../_lib/mail";
import { rateLimit, rateLimitShared } from "../../_lib/rate-limit";
import { deletionCodeHash, sessionClaims } from "../../_lib/session";

export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  const claims = await sessionClaims();
  const userId = claims?.userId ?? null;
  if (!userId) return bad("Entre para jogar.", 401);
  const gate = rateLimit("delcode:" + userId, 3, 600000);
  const gateShared = await rateLimitShared("delcode:" + userId, 3, 600);
  if (!gate.allowed || !gateShared) {
    return bad("A code was already sent. Check the e-mail before asking for another.", 429);
  }
  try {
    const code = String(randomInt(0, 10000)).padStart(4, "0");
    const email = await withTransaction(async (client) => {
      if (claims && !(await sessionIsLive(client, claims))) return undefined;
      const found = await client.query("select email from users where id = $1", [userId]);
      const to = found.rows[0]?.email as string | undefined;
      if (!to) return null;
      await client.query(
        `insert into deletion_codes (user_id, code_hash, expires_at, attempts)
         values ($1, $2, now() + interval '10 minutes', 0)
         on conflict (user_id) do update set
           code_hash = $2, expires_at = now() + interval '10 minutes', attempts = 0`,
        [userId, deletionCodeHash(userId, code)],
      );
      return to;
    });
    if (!email) return bad("Conta sem e-mail conhecido.", 404);
    await sendDeletionCodeEmail(email, code);
    return NextResponse.json({
      ok: true,
      message: "Code sent to your e-mail. It is good for 10 minutes.",
      data: null,
    });
  } catch (error) {
    console.error("[api] POST /api/characters/delete-code", error);
    return bad("The mail stumbled. Try again.", 500);
  }
}
