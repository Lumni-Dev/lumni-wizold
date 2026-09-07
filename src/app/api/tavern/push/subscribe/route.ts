import { NextResponse } from "next/server";
import { withTransaction } from "@/models/repositories/server/database";
import { upsertPushSubscription } from "@/models/repositories/server/push.store";
import { asText, bad, readBody, refuseAbuse, sessionIsLive } from "@/app/api/_lib/api";
import { sessionClaims } from "@/app/api/_lib/session";
import { rateLimit } from "@/app/api/_lib/rate-limit";

export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  const claims = await sessionClaims();
  if (!claims) return bad("Enter to play.", 401);
  const gate = rateLimit("push-sub:" + claims.userId, 10, 60000);
  if (!gate.allowed) return bad("Easy, wolf: too many requests. Breathe for a moment.", 429);

  const body = await readBody(request);
  const endpoint = asText(body.endpoint, 2048);
  const keys =
    typeof body.keys === "object" && body.keys !== null
      ? (body.keys as { p256dh?: unknown; auth?: unknown })
      : {};
  const p256dh = asText(keys.p256dh, 256);
  const auth = asText(keys.auth, 128);
  if (!endpoint || !p256dh || !auth) return bad("Invalid subscription.", 400);

  try {
    await withTransaction(async (client) => {
      if (!(await sessionIsLive(client, claims))) throw new Error("session");
      await upsertPushSubscription(client, claims.userId, endpoint, p256dh, auth);
    });
    return NextResponse.json({ ok: true, message: "", data: null });
  } catch {
    return bad("Session ended.", 401);
  }
}
