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
  if (!pending) return bad("A verificação expirou. Entre de novo com o Google.", 401);

  const gate = rateLimit("2fa-resend:" + pending.userId, 3, 600000);
  const gateShared = await rateLimitShared("2fa-resend:" + pending.userId, 3, 600);
  if (!gate.allowed || !gateShared) {
    return bad("Um código já foi enviado. Confira o e-mail antes de pedir outro.", 429);
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

    if (payload === undefined) return bad("A verificação expirou. Entre de novo com o Google.", 401);
    if (payload === null) return bad("Conta sem e-mail conhecido.", 404);

    await sendTwoFactorCodeEmail(payload.to, payload.code, "login");
    return NextResponse.json({
      ok: true,
      message: "Novo código enviado para o seu e-mail. Ele vale por 10 minutos.",
      data: null,
    });
  } catch (error) {
    console.error("[api] POST /api/auth/two-factor/resend", error);
    return bad("O correio tropeçou. Tente de novo.", 500);
  }
}
