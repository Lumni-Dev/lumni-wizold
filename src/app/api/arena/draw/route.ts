import { failure, success } from "@/models/entities/result";
import * as arenaController from "@/controllers/arena.controller";
import { withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, (state) => {
    const opponent = arenaController.drawOpponent(state);
    return opponent
      ? success(state, "", { hunterId: opponent.id, name: opponent.name })
      : failure(state, "Ninguém descansado na sua faixa agora.");
  });
}
