import { failure, success } from "@/models/entities/result";
import { cachedHunters } from "../../_lib/roster-cache";
import * as arenaController from "@/controllers/arena.controller";
import { withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, async (state, _body, context) => {
    const roster = await cachedHunters(context.client);
    if (roster.length <= 1) {
      return failure(state, "O fosso espera outros caçadores: por enquanto você é o único vivo.");
    }
    const opponent = arenaController.drawOpponent(state, roster);
    return opponent
      ? success(state, "", { hunterId: opponent.id, name: opponent.name })
      : failure(state, "Ninguém descansado na sua faixa agora.");
  });
}
