import { success } from "@/models/entities/result";
import { loadHunters } from "@/models/repositories/server/roster.store";
import * as arenaController from "@/controllers/arena.controller";
import { withGame } from "../_lib/api";

export async function GET(request: Request) {
  return withGame(request, async (state, _body, context) => {
    const search = new URL(request.url).searchParams.get("search") ?? "";
    const roster = await loadHunters(context.client);
    return success(state, "", arenaController.listArena(state, roster, search.slice(0, 40)));
  });
}
