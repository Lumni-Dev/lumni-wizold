import { randomUUID } from "node:crypto";
import { NextResponse, after } from "next/server";
import { MIN_AGE } from "@/shared/constants/game";
import { ageOf, isRealBirth } from "@/shared/utils/birth";
import { withTransaction } from "@/models/repositories/server/database";
import { createUser, findUserByEmail } from "@/models/repositories/server/user.store";
import { loadGame } from "@/models/repositories/server/game.store";
import { asText, bad, clientIp, clientLocale, readBody, refuseAbuse } from "../../_lib/api";
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
    const response = bad("Too many tries. Wait a bit before entering again.", 429);
    response.headers.set("retry-after", "300");
    return response;
  }
  const body = await readBody(request);
  const locale = clientLocale(request);
  const credential = asText(body.credential, 4096).trim();
  if (!credential) {
    return bad("Enter with Google to open the door.", 400);
  }
  const birth = {
    day: asText((body.birth as Record<string, unknown> | undefined)?.day, 2),
    month: asText((body.birth as Record<string, unknown> | undefined)?.month, 2),
    year: asText((body.birth as Record<string, unknown> | undefined)?.year, 4),
  };
  const age = ageOf(birth);
  if (isRealBirth(birth) && age !== null && age < MIN_AGE) {
    return bad("The hunt is for ages " + MIN_AGE + " and up.", 403);
  }
  const identity = await verifyGoogleCredential(credential);
  if (!identity) {
    return bad("Google did not confirm the entry. Try again.", 401);
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
        return bad("Fill in the birth date.", 400);
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
          locale,
        ));
      if (!existing) {
        after(() =>
          sendWelcomeEmail(identity.email, locale).catch((error) =>
            console.error("[mail] welcome", error),
          ),
        );
      } else if (
        !identity.email.endsWith("@wizold.test") &&
        !user.twoFactorEnabled
      ) {
        const accessedAt = new Date();
        after(() =>
          sendAccessEmail(identity.email, accessedAt, locale).catch((error) =>
            console.error("[mail] access notice", error),
          ),
        );
      }
      await client.query("update users set picture = $2, locale = $3 where id = $1", [
        user.id,
        identity.picture,
        locale,
      ]);

      const loaded = await loadGame(client, user.id, false);
      const skipTwoFactor =
        !user.twoFactorEnabled || identity.email.endsWith("@wizold.test");

      if (!skipTwoFactor) {
        const code = mintTwoFactorCode();
        await saveTwoFactorCode(client, user.id, code);
        after(() =>
          sendTwoFactorCodeEmail(identity.email, code, "login", locale).catch((error) =>
            console.error("[mail] 2fa code", error),
          ),
        );
        await attachTwoFactorPending(user.id, user.epoch);
        return NextResponse.json({
          ok: true,
          message: "Code sent to your e-mail.",
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
        message: existing ? "Welcome back." : "Account created. The hunt awaits.",
        data: { userId: user.id, hasCharacter: loaded !== null, tutorial: user.tutorial },
      });
    });
  } catch (error) {
    console.error("[api] POST /api/auth/enter", error);
    return bad("The server stumbled. Try again.", 500);
  }
}
