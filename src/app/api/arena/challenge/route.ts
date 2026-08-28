import * as arenaController from "@/controllers/arena.controller";
import { asText, withGame } from "../../_lib/api";
export async function POST(request: Request) {
  return withGame(request, (state, body) => {
    const resolved = arenaController.resolveArena(state, asText(body.hunterId, 60));
    if (!resolved.ok || !resolved.data) return resolved;
    return arenaController.landArena(state, resolved.data, 0);
  });
}
