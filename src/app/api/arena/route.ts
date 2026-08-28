import { success } from "@/models/entities/result";
import * as arenaController from "@/controllers/arena.controller";
import { withGame } from "../_lib/api";

export async function GET(request: Request) {
  return withGame(request, (state) => {
    const search = new URL(request.url).searchParams.get("search") ?? "";
    return success(state, "", arenaController.listArena(state, search.slice(0, 40)));
  });
}
