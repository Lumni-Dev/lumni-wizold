import * as arenaController from "@/controllers/arena.controller";
import { asText, withGame } from "../../_lib/api";

// The duel is resolved and landed server-side in one transaction: charges,
// band, cooldown and the health floor are all refused here, and the spoils
// come from the server's own dice.
export async function POST(request: Request) {
  return withGame(request, (state, body) => {
    const resolved = arenaController.resolveArena(state, asText(body.hunterId, 60));
    if (!resolved.ok || !resolved.data) return resolved;
    return arenaController.landArena(state, resolved.data, 0);
  });
}
