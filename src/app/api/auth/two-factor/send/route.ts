import { NextResponse } from "next/server";
import { withTransaction } from "@/models/repositories/server/database";
import { asText, bad, clientLocale, readBody, refuseAbuse, sessionIsLive } from "../../../_lib/api";
import { sendTwoFactorCodeEmail } from "../../../_lib/mail";
import { rateLimit, rateLimitShared } from "../../../_lib/rate-limit";
import { sessionClaims } from "../../../_lib/session";
import { mintTwoFactorCode, saveTwoFactorCode } from "../../../_lib/two-factor";

export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;

  const claims = await sessionClaims();
  const userId = claims?.userId ?? null;
  if (!userId) return bad("Enter to play.", 401);

  const body = await readBody(request);
  const action = asText(body.action, 16) === "disable" ? "disable" : "enable";

  const gate = rateLimit("2fa-setup:" + userId + ":" + action, 3, 600000);
  const gateShared = await rateLimitShared("2fa-setup:" + userId + ":" + action, 3, 600);
  if (!gate.allowed || !gateShared) {
    return bad("A code was already sent. Check the e-mail before asking for another.", 429);
  }

  try {
    const payload = await withTransaction(async (client) => {
      if (claims && !(await sessionIsLive(client, claims))) return undefined;
      const found = await client.query(
        "select email, two_factor_enabled from users where id = $1",
        [userId],
      );
      const row = found.rows[0];
      const to = row?.email as string | undefined;
      if (!to) return null;
      if (action === "enable" && row.two_factor_enabled === true) return false;
      if (action === "disable" && row.two_factor_enabled !== true) return false;
      const code = mintTwoFactorCode();
      await saveTwoFactorCode(client, userId, code);
      return { to, code };
    });

    if (payload === undefined) return bad("Session ended.", 401);
    if (payload === null) return bad("Account with no known e-mail.", 404);
    if (payload === false) {
      return NextResponse.json({
        ok: false,
        message:
          action === "enable"
            ? "Verification is already on."
            : "Verification is already off.",
      });
    }

    await sendTwoFactorCodeEmail(payload.to, payload.code, action, clientLocale(request));
    return NextResponse.json({
      ok: true,
      message: "Code sent to your e-mail. It is good for 10 minutes.",
      data: null,
    });
  } catch (error) {
    console.error("[api] POST /api/auth/two-factor/send", error);
    return bad("The mail stumbled. Try again.", 500);
  }
}
