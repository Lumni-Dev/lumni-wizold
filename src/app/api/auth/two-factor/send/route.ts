import { NextResponse } from "next/server";
import { withTransaction } from "@/models/repositories/server/database";
import { asText, bad, readBody, refuseAbuse, sessionIsLive } from "../../../_lib/api";
import { sendTwoFactorCodeEmail } from "../../../_lib/mail";
import { rateLimit, rateLimitShared } from "../../../_lib/rate-limit";
import { sessionClaims } from "../../../_lib/session";
import { mintTwoFactorCode, saveTwoFactorCode } from "../../../_lib/two-factor";

export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;

  const claims = await sessionClaims();
  const userId = claims?.userId ?? null;
  if (!userId) return bad("Entre para jogar.", 401);

  const body = await readBody(request);
  const action = asText(body.action, 16) === "disable" ? "disable" : "enable";

  const gate = rateLimit("2fa-setup:" + userId + ":" + action, 3, 600000);
  const gateShared = await rateLimitShared("2fa-setup:" + userId + ":" + action, 3, 600);
  if (!gate.allowed || !gateShared) {
    return bad("Um código já foi enviado. Confira o e-mail antes de pedir outro.", 429);
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

    if (payload === undefined) return bad("Sessão encerrada.", 401);
    if (payload === null) return bad("Conta sem e-mail conhecido.", 404);
    if (payload === false) {
      return NextResponse.json({
        ok: false,
        message:
          action === "enable"
            ? "A verificação já está ligada."
            : "A verificação já está desligada.",
      });
    }

    await sendTwoFactorCodeEmail(payload.to, payload.code, action);
    return NextResponse.json({
      ok: true,
      message: "Código enviado para o seu e-mail. Ele vale por 10 minutos.",
      data: null,
    });
  } catch (error) {
    console.error("[api] POST /api/auth/two-factor/send", error);
    return bad("O correio tropeçou. Tente de novo.", 500);
  }
}
