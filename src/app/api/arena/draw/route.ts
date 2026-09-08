import { failure, success } from "@/models/entities/result";
import { workActivityBlockReason } from "@/models/entities/activity";
import { readActivity } from "@/models/repositories/server/game.store";
import { cachedHunters } from "../../_lib/roster-cache";
import * as arenaController from "@/controllers/arena.controller";
import { withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, async (state, _body, context) => {
    const { activity } = await readActivity(context.client, context.characterId);
    const blocked = workActivityBlockReason(activity);
    if (blocked) return failure(state, blocked);
    const roster = await cachedHunters(context.client);
    if (roster.length <= 1) {
      return failure(state, "The pit waits for other hunters: for now you are the only one alive.");
    }
    const opponent = arenaController.drawOpponent(state, roster);
    return opponent
      ? success(state, "", { hunterId: opponent.id, name: opponent.name })
      : failure(state, "Nobody rested right now: everyone left is recovering from a duel.");
  });
}
