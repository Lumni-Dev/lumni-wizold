import { randomUUID } from "node:crypto";
import { NextResponse, after } from "next/server";
import { MIN_AGE } from "@/shared/constants/game";
import { ageOf, isRealBirth } from "@/shared/utils/birth";
import { withTransaction } from "@/models/repositories/server/database";
import { createUser, findUserByEmail } from "@/models/repositories/server/user.store";
import { loadGame } from "@/models/repositories/server/game.store";
import { asText, bad, clientIp, readBody, refuseAbuse } from "../../_lib/api";
import { verifyGoogleCredential } from "../../_lib/google";
import { sendAccessEmail, sendTwoFactorCodeEmail, sendWelcomeEmail } from "../../_lib/mail";
import { rateLimit, rateLimitShared } from "../../_lib/rate-limit";
import { attachSession, attachTwoFactorPending } from "../../_lib/session";
import { mintTwoFactorCode, saveTwoFactorCode } from "../../_lib/two-factor";
export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  const gate = rateLimit("enter:" + clientIp(request), 10, 300000);
  const gateShared = await rateLimitShared("enter:" + clientIp(request), 10, 300);
  if (!gate.allowed || !gateShared) {
    const response = bad("Muitas tentativas. Espere um pouco antes de entrar de novo.", 429);
    response.headers.set("retry-after", "300");
    return response;
  }
  const body = await readBody(request);
  const credential = asText(body.credential, 4096).trim();
  if (!credential) {
    return bad("Entre com o Google para abrir a porta.", 400);
  }
  const birth = {
    day: asText((body.birth as Record<string, unknown> | undefined)?.day, 2),
    month: asText((body.birth as Record<string, unknown> | undefined)?.month, 2),
    year: asText((body.birth as Record<string, unknown> | undefined)?.year, 4),
  };
  const age = ageOf(birth);
  if (isRealBirth(birth) && age !== null && age < MIN_AGE) {
    return bad("A caçada é para maiores de " + MIN_AGE + " anos.", 403);
  }
  const identity = await verifyGoogleCredential(credential);
  if (!identity) {
    return bad("O Google não confirmou a entrada. Tente de novo.", 401);
  }
  try {
    return await withTransaction(async (client) => {
      const existing = await findUserByEmail(client, identity.email);
      if (existing?.banished) {
        return NextResponse.json({
          ok: true,
          message: "",
          data: { banished: true },
        });
      }
      if (!existing && (!isRealBirth(birth) || age === null)) {
        return bad("Preencha a data de nascimento.", 400);
      }
      const user =
        existing ??
        (await createUser(
          client,
          identity.email,
          birth.year.padStart(4, "0") +
            "-" +
            birth.month.padStart(2, "0") +
            "-" +
            birth.day.padStart(2, "0"),
        ));
      if (!existing) {
        after(() =>
          sendWelcomeEmail(identity.email).catch((error) =>
            console.error("[mail] boas-vindas", error),
          ),
        );
      } else if (
        !identity.email.endsWith("@wizold.test") &&
        !user.twoFactorEnabled
      ) {
        const accessedAt = new Date();
        after(() =>
          sendAccessEmail(identity.email, accessedAt).catch((error) =>
            console.error("[mail] aviso de acesso", error),
          ),
        );
      }
      await client.query("update users set picture = $2 where id = $1", [
        user.id,
        identity.picture,
      ]);

      const loaded = await loadGame(client, user.id, false);
      const skipTwoFactor =
        !user.twoFactorEnabled || identity.email.endsWith("@wizold.test");

      if (!skipTwoFactor) {
        const code = mintTwoFactorCode();
        await saveTwoFactorCode(client, user.id, code);
        after(() =>
          sendTwoFactorCodeEmail(identity.email, code, "login").catch((error) =>
            console.error("[mail] código 2fa", error),
          ),
        );
        await attachTwoFactorPending(user.id, user.epoch);
        return NextResponse.json({
          ok: true,
          message: "Código enviado para o seu e-mail.",
          data: {
            userId: user.id,
            hasCharacter: loaded !== null,
            needsTwoFactor: true,
            tutorial: user.tutorial,
          },
        });
      }

      await attachSession(user.id, user.epoch);
      if (!identity.email.endsWith("@wizold.test")) {
        await client.query(
          `insert into account_accesses (id, email, character_name, first_time, ip)
           values ($1, $2, $3, $4, $5)`,
          [
            "acc_" + randomUUID().replaceAll("-", ""),
            identity.email,
            loaded?.state.character?.name ?? null,
            !existing,
            clientIp(request),
          ],
        );
      }
      return NextResponse.json({
        ok: true,
        message: existing ? "Bem-vindo de volta." : "Conta criada. A caçada aguarda.",
        data: { userId: user.id, hasCharacter: loaded !== null, tutorial: user.tutorial },
      });
    });
  } catch (error) {
    console.error("[api] POST /api/auth/enter", error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}
