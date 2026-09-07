import { NextResponse } from "next/server";
import { withTransaction } from "@/models/repositories/server/database";
import { bad, refuseAbuse, sessionIsLive } from "../../../_lib/api";
import { sendTwoFactorCodeEmail } from "../../../_lib/mail";
import { rateLimit, rateLimitShared } from "../../../_lib/rate-limit";
import {
  attachTwoFactorPending,
  dropTwoFactorPending,
  twoFactorPendingClaims,
} from "../../../_lib/session";
import { mintTwoFactorCode, saveTwoFactorCode } from "../../../_lib/two-factor";

export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;

  const pending = await twoFactorPendingClaims();
  if (!pending) return bad("The verification expired. Enter again with Google.", 401);

  const gate = rateLimit("2fa-resend:" + pending.userId, 3, 600000);
  const gateShared = await rateLimitShared("2fa-resend:" + pending.userId, 3, 600);
  if (!gate.allowed || !gateShared) {
    return bad("A code was already sent. Check the e-mail before asking for another.", 429);
  }

  try {
    const payload = await withTransaction(async (client) => {
      if (!(await sessionIsLive(client, pending))) {
        await dropTwoFactorPending();
        return undefined;
      }
      const found = await client.query("select email from users where id = $1", [pending.userId]);
      const to = found.rows[0]?.email as string | undefined;
      if (!to) return null;
      const code = mintTwoFactorCode();
      await saveTwoFactorCode(client, pending.userId, code);
      await attachTwoFactorPending(pending.userId, pending.epoch);
      return { to, code };
    });

    if (payload === undefined) return bad("The verification expired. Enter again with Google.", 401);
    if (payload === null) return bad("Conta sem e-mail conhecido.", 404);

    await sendTwoFactorCodeEmail(payload.to, payload.code, "login");
    return NextResponse.json({
      ok: true,
      message: "New code sent to your e-mail. It is good for 10 minutes.",
      data: null,
    });
  } catch (error) {
    console.error("[api] POST /api/auth/two-factor/resend", error);
    return bad("The mail stumbled. Try again.", 500);
  }
}
