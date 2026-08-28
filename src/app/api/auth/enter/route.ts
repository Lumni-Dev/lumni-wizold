import { NextResponse } from "next/server";
import { MIN_AGE } from "@/shared/constants/game";
import { ageOf, isRealBirth } from "@/shared/utils/birth";
import { withTransaction } from "@/models/repositories/server/database";
import { createUser, findUserByEmail } from "@/models/repositories/server/user.store";
import { loadGame } from "@/models/repositories/server/game.store";
import { asText, bad, clientIp, readBody, refuseAbuse } from "../../_lib/api";
import { verifyGoogleCredential } from "../../_lib/google";
import { rateLimit } from "../../_lib/rate-limit";
import { attachSession } from "../../_lib/session";
export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  const gate = rateLimit("enter:" + clientIp(request), 20, 300000);
  if (!gate.allowed) {
    const response = bad("Muitas tentativas. Espere um pouco antes de entrar de novo.", 429);
    response.headers.set("retry-after", String(Math.ceil(gate.retryAfterMs / 1000)));
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
      await attachSession(user.id);
      const loaded = await loadGame(client, user.id, false);
      return NextResponse.json({
        ok: true,
        message: existing ? "Bem-vindo de volta." : "Conta criada. A caçada aguarda.",
        data: { userId: user.id, hasCharacter: loaded !== null },
      });
    });
  } catch (error) {
    console.error("[api] POST /api/auth/enter", error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}
