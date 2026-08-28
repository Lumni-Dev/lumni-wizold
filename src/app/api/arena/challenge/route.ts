import { loadHunters } from "@/models/repositories/server/roster.store";
import * as arenaController from "@/controllers/arena.controller";
import { asText, withGame } from "../../_lib/api";
export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const roster = await loadHunters(context.client);
    const resolved = arenaController.resolveArena(state, roster, asText(body.hunterId, 80));
    if (!resolved.ok || !resolved.data) return resolved;
    return arenaController.landArena(state, resolved.data, 0);
  });
}
