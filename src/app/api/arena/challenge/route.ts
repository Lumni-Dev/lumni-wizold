import { cachedHunters } from "../../_lib/roster-cache";
import { recordArenaDuel } from "@/models/repositories/server/arena.store";
import { interruptRest } from "@/models/repositories/server/game.store";
import { cooldownLeft, setCooldown } from "@/models/repositories/server/action-cooldown";
import { failure } from "@/models/entities/result";
import { HUNT_TICK_MS } from "@/shared/constants/game";
import * as arenaController from "@/controllers/arena.controller";
import { asText, withGame } from "../../_lib/api";
export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    if (cooldownLeft("arena:" + context.characterId) > 0) {
      return failure(state, "");
    }
    const roster = await cachedHunters(context.client);
    const resolved = arenaController.resolveArena(state, roster, asText(body.hunterId, 80));
    if (!resolved.ok || !resolved.data) return resolved;
    const landed = arenaController.landArena(state, resolved.data, 0);
    if (landed.ok && landed.data) {
      await interruptRest(context.client, context.characterId);
      setCooldown("arena:" + context.characterId, landed.data.combat.rounds.length * HUNT_TICK_MS);
      if (state.character) {
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
    }
    return landed;
  });
}
