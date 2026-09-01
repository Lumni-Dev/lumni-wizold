import { randomUUID } from "node:crypto";
import { NextResponse, after } from "next/server";
import { withTransaction } from "@/models/repositories/server/database";
import { loadGame } from "@/models/repositories/server/game.store";
import { asText, bad, clientIp, readBody, refuseAbuse, sessionIsLive } from "../../../_lib/api";
import { sendAccessEmail } from "../../../_lib/mail";
import { rateLimit } from "../../../_lib/rate-limit";
import {
  attachSession,
  dropTwoFactorPending,
  twoFactorPendingClaims,
} from "../../../_lib/session";
import { verifyTwoFactorCode } from "../../../_lib/two-factor";

export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;

  const pending = await twoFactorPendingClaims();
  if (!pending) return bad("A verificação expirou. Entre de novo com o Google.", 401);

  const gate = rateLimit("2fa-verify:" + pending.userId, 10, 600000);
  if (!gate.allowed) {
    return bad("Muitas tentativas. Espere um pouco antes de tentar de novo.", 429);
  }

  const body = await readBody(request);
  const code = asText(body.code, 8).trim();
  if (!code) return bad("Digite o código de oito dígitos.", 400);

  try {
    return await withTransaction(async (client) => {
      if (!(await sessionIsLive(client, pending))) {
        await dropTwoFactorPending();
        return bad("A verificação expirou. Entre de novo com o Google.", 401);
      }

      const checked = await verifyTwoFactorCode(client, pending.userId, code);
      if (!checked.ok) return NextResponse.json({ ok: false, message: checked.message });

      const found = await client.query("select email from users where id = $1", [pending.userId]);
      const email = found.rows[0]?.email as string | undefined;
      if (!email) return bad("Conta sem e-mail conhecido.", 404);

      const loaded = await loadGame(client, pending.userId, false);
      if (!email.endsWith("@wizold.test")) {
        const accessedAt = new Date();
        after(() =>
          sendAccessEmail(email, accessedAt).catch((error) =>
            console.error("[mail] aviso de acesso", error),
          ),
        );
        await client.query(
          `insert into account_accesses (id, email, character_name, first_time, ip)
           values ($1, $2, $3, false, $4)`,
          [
            "acc_" + randomUUID().replaceAll("-", ""),
            email,
            loaded?.state.character?.name ?? null,
            clientIp(request),
          ],
        );
      }

      await attachSession(pending.userId, pending.epoch);
      await dropTwoFactorPending();

      return NextResponse.json({
        ok: true,
        message: "Porta aberta. Boa caçada.",
        data: { hasCharacter: loaded !== null },
      });
    });
  } catch (error) {
    console.error("[api] POST /api/auth/two-factor/verify", error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}
