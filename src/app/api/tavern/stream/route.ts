import { withReadOnly } from "@/models/repositories/server/database";
import { sessionClaims } from "../../_lib/session";
import { bad, refuseAbuse, sessionIsLive } from "../../_lib/api";
import { buildTavernBoard } from "../../_lib/tavern-board";
import { subscribeTavernRevision } from "../../_lib/tavern-bus";
import { rateLimit } from "../../_lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_MS = 5000;
const PING_MS = 15000;
// Vercel kills the invocation at its 300s ceiling and logs the kill as a
// runtime timeout, so the stream retires itself first: a clean close lands in
// the client's onerror, which reconnects in 3s, and the fresh stream pushes
// the board at once (lastRevision starts at -1), so a rotation costs one
// blink and never a timeout in the logs.
const LIFETIME_MS = 240000;

function sseChunk(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode("event: " + event + "\ndata: " + JSON.stringify(data) + "\n\n");
}

export async function GET(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  const claims = await sessionClaims();
  if (!claims) return bad("Enter to play.", 401);
  const gate = rateLimit("tavern-stream:" + claims.userId, 12, 60000);
  if (!gate.allowed) return bad("Easy, wolf: too many requests. Breathe for a moment.", 429);

  let closed = false;
  let lastRevision = -1;

  const stream = new ReadableStream({
    start(controller) {
      let inFlight = false;
      let queued = false;
      let unsub = () => {};

      // The timers are declared below, at their assignment: shutdown only ever
      // runs after start() finishes, so the closure never sees them unset.
      const shutdown = () => {
        if (closed) return;
        closed = true;
        clearInterval(poll);
        clearInterval(keepAlive);
        clearTimeout(retire);
        unsub();
        try {
          controller.close();
        } catch {}
      };

      // One query lane per stream: the initial push, the bus and the poll can
      // all land at once, and each used to check out its own pool client
      // mid-flight, so a slow read let a newer board be enqueued before an
      // older one. A push that finds the lane busy leaves a single follow-up
      // note instead, and the revision guard is monotonic for the same reason.
      const pushBoard = async () => {
        if (closed) return;
        if (inFlight) {
          queued = true;
          return;
        }
        inFlight = true;
        try {
          await withReadOnly(async (client) => {
            if (closed) return;
            if (!(await sessionIsLive(client, claims))) {
              controller.enqueue(sseChunk("end", { reason: "session" }));
              shutdown();
              return;
            }
            const board = await buildTavernBoard(client, claims.userId);
            if (!board || closed) return;
            if (board.revision <= lastRevision) return;
            lastRevision = board.revision;
            controller.enqueue(sseChunk("board", board));
          });
        } catch (error) {
          console.error("[tavern/stream]", error);
        } finally {
          inFlight = false;
          if (queued && !closed) {
            queued = false;
            void pushBoard();
          }
        }
      };

      const ping = () => {
        if (closed) return;
        controller.enqueue(new TextEncoder().encode(": ping\n\n"));
      };

      void pushBoard();
      unsub = subscribeTavernRevision(() => void pushBoard());
      const poll = setInterval(() => void pushBoard(), POLL_MS);
      const keepAlive = setInterval(ping, PING_MS);
      const retire = setTimeout(shutdown, LIFETIME_MS);

      request.signal.addEventListener("abort", shutdown);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
