import { NextResponse } from "next/server";
import { withTransaction } from "@/models/repositories/server/database";
import { asText, bad, readBody, refuseAbuse, sessionIsLive } from "../../../_lib/api";
import { rateLimit } from "../../../_lib/rate-limit";
import { sessionClaims } from "../../../_lib/session";
import { verifyTwoFactorCode } from "../../../_lib/two-factor";

export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;

  const claims = await sessionClaims();
  const userId = claims?.userId ?? null;
  if (!userId) return bad("Entre para jogar.", 401);

  const gate = rateLimit("2fa-disable:" + userId, 10, 600000);
  if (!gate.allowed) return bad("Too many tries. Wait a bit.", 429);

  const body = await readBody(request);
  const code = asText(body.code, 8).trim();
  if (!code) return bad("Type the eight-digit code.", 400);

  try {
    return await withTransaction(async (client) => {
      if (claims && !(await sessionIsLive(client, claims))) return bad("Session ended.", 401);

      const checked = await verifyTwoFactorCode(client, userId, code);
      if (!checked.ok) return NextResponse.json({ ok: false, message: checked.message });

      await client.query("update users set two_factor_enabled = false where id = $1", [userId]);
      return NextResponse.json({
        ok: true,
        message: "Two-step verification off.",
        data: null,
      });
    });
  } catch (error) {
    console.error("[api] POST /api/auth/two-factor/disable", error);
    return bad("The server stumbled. Try again.", 500);
  }
}
