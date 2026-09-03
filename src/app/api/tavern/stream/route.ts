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

function sseChunk(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode("event: " + event + "\ndata: " + JSON.stringify(data) + "\n\n");
}

export async function GET(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  const claims = await sessionClaims();
  if (!claims) return bad("Entre para jogar.", 401);
  const gate = rateLimit("tavern-stream:" + claims.userId, 12, 60000);
  if (!gate.allowed) return bad("Calma, lobo: muitas requisições. Respire um instante.", 429);

  let closed = false;
  let lastRevision = -1;

  const stream = new ReadableStream({
    start(controller) {
      const pushBoard = async () => {
        if (closed) return;
        try {
          await withReadOnly(async (client) => {
            if (!(await sessionIsLive(client, claims))) {
              controller.enqueue(sseChunk("end", { reason: "session" }));
              controller.close();
              closed = true;
              return;
            }
            const board = await buildTavernBoard(client, claims.userId);
            if (!board || closed) return;
            if (board.revision === lastRevision) return;
            lastRevision = board.revision;
            controller.enqueue(sseChunk("board", board));
          });
        } catch (error) {
          console.error("[tavern/stream]", error);
        }
      };

      const ping = () => {
        if (closed) return;
        controller.enqueue(new TextEncoder().encode(": ping\n\n"));
      };

      void pushBoard();
      const unsub = subscribeTavernRevision(() => void pushBoard());
      const poll = setInterval(() => void pushBoard(), POLL_MS);
      const keepAlive = setInterval(ping, PING_MS);

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(poll);
        clearInterval(keepAlive);
        unsub();
        try {
          controller.close();
        } catch {}
      });
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
