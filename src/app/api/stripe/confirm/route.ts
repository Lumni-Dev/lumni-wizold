import { NextResponse } from "next/server";
import { withTransaction } from "@/models/repositories/server/database";
import { loadGame } from "@/models/repositories/server/game.store";
import { asText, bad, readBody, refuseAbuse, sessionIsLive } from "../../_lib/api";
import { fulfillSession } from "../../_lib/fulfill";
import { rateLimit } from "../../_lib/rate-limit";
import { sessionClaims } from "../../_lib/session";
import { retrieveSession } from "../../_lib/stripe";

export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  const claims = await sessionClaims();
  if (!claims) return bad("Entre para jogar.", 401);
  const userId = claims.userId;
  const gate = rateLimit("act:" + userId, 30, 10000);
  if (!gate.allowed) return bad("Calma, lobo: muitas requisições. Respire um instante.", 429);
  const body = await readBody(request);
  const sessionId = asText(body.sessionId, 120).trim();
  if (!sessionId) return bad("Sessão de pagamento desconhecida.", 400);
  try {
    const session = await retrieveSession(sessionId);
    if (!session || session.metadata.userId !== userId) {
      return bad("Sessão de pagamento desconhecida.", 404);
    }
    return await withTransaction(async (client) => {
      if (!(await sessionIsLive(client, claims))) return bad("Sessão encerrada.", 401);
      const outcome = await fulfillSession(client, session);
      const loaded = await loadGame(client, userId, false);
      return NextResponse.json({
        ok: outcome.ok,
        message: outcome.message,
        data: null,
        state: loaded?.state ?? null,
      });
    });
  } catch (error) {
    console.error("[api] POST /api/stripe/confirm", error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}
