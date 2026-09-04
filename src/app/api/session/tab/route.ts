import { NextResponse } from "next/server";
import { withTransaction } from "@/models/repositories/server/database";
import { asText, bad, readBody, refuseAbuse, sessionIsLive } from "../../_lib/api";
import { sessionClaims } from "../../_lib/session";

const TAB_STALE_MS = 25_000;

export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  const claims = await sessionClaims();
  if (!claims) return bad("Entre para jogar.", 401);
  const body = await readBody(request);
  const tabId = asText(body.tabId, 64).trim();
  const force = body.force === true;
  if (!tabId) return bad("Aba inválida.", 400);
  try {
    return await withTransaction(async (client) => {
      if (!(await sessionIsLive(client, claims))) return bad("Sessão encerrada.", 401);
      const found = await client.query(
        `select active_tab, extract(epoch from (now() - active_tab_at)) * 1000 as age
           from users where id = $1 for update`,
        [claims.userId],
      );
      const row = found.rows[0];
      const current: string | null = row?.active_tab ?? null;
      const ageMs =
        row?.age === null || row?.age === undefined ? Number.POSITIVE_INFINITY : Number(row.age);
      const takeable = force || current === null || current === tabId || ageMs > TAB_STALE_MS;
      const owner = takeable ? tabId : current;
      if (takeable) {
        await client.query(
          "update users set active_tab = $2, active_tab_at = now() where id = $1",
          [claims.userId, tabId],
        );
      }
      return NextResponse.json({ ok: true, message: "", data: { owner, mine: owner === tabId } });
    });
  } catch (error) {
    console.error("[api] POST /api/session/tab", error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}
