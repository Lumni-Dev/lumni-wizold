import { loadHunters } from "@/models/repositories/server/roster.store";
import { recordArenaDuel } from "@/models/repositories/server/arena.store";
import * as arenaController from "@/controllers/arena.controller";
import { asText, withGame } from "../../_lib/api";
export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const roster = await loadHunters(context.client);
    const resolved = arenaController.resolveArena(state, roster, asText(body.hunterId, 80));
    if (!resolved.ok || !resolved.data) return resolved;
    const landed = arenaController.landArena(state, resolved.data, 0);
    if (landed.ok && landed.data && state.character) {
      const { combat, hunter, spoils } = landed.data;
      await recordArenaDuel(context.client, {
        challengerId: state.character.id,
        challengerName: state.character.name,
        rivalId: hunter.id,
        rivalName: hunter.name,
        outcome: combat.victory ? "victory" : combat.retreated ? "draw" : "defeat",
        spoils: Math.abs(spoils),
      });
    }
    return landed;
  });
}
