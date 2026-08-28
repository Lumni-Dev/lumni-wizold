import { NextResponse } from "next/server";
import { MIN_AGE } from "@/shared/constants/game";
import { ageOf, isRealBirth } from "@/shared/utils/birth";
import { withTransaction } from "@/models/repositories/server/database";
import { createUser, findUserByEmail } from "@/models/repositories/server/user.store";
import { loadGame } from "@/models/repositories/server/game.store";
import { asText, bad, clientIp, readBody, refuseAbuse } from "../../_lib/api";
import { rateLimit } from "../../_lib/rate-limit";
import { attachSession } from "../../_lib/session";

// The door. A demo of the Google login with the same contract the real one
// will honor: the age gate is enforced HERE, not only on the screen, because
// a field is not a guarantee.
export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;

  const gate = rateLimit("enter:" + clientIp(request), 20, 300_000);
  if (!gate.allowed) {
    const response = bad("Muitas tentativas. Espere um pouco antes de entrar de novo.", 429);
    response.headers.set("retry-after", String(Math.ceil(gate.retryAfterMs / 1000)));
    return response;
  }

  const body = await readBody(request);
  const email = asText(body.email, 254).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad("Informe um e-mail válido.", 400);
  }

  const birth = {
    day: asText((body.birth as Record<string, unknown> | undefined)?.day, 2),
    month: asText((body.birth as Record<string, unknown> | undefined)?.month, 2),
    year: asText((body.birth as Record<string, unknown> | undefined)?.year, 4),
  };

  try {
    return await withTransaction(async (client) => {
      const existing = await findUserByEmail(client, email);

      if (!existing) {
        const age = ageOf(birth);
        if (!isRealBirth(birth) || age === null) {
          return bad("Preencha a data de nascimento.", 400);
        }
        if (age < MIN_AGE) {
          return bad("A caçada é para maiores de " + MIN_AGE + " anos.", 403);
        }
      }

      const user =
        existing ??
        (await createUser(
          client,
          email,
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
