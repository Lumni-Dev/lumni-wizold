import { success } from "@/models/entities/result";
import { listArenaHistory } from "@/models/repositories/server/arena.store";
import { withGame } from "../../_lib/api";

export async function GET(request: Request) {
  return withGame(request, async (state, _body, context) => {
    const history = state.character ? await listArenaHistory(context.client, state.character.id) : [];
    return success(state, "", { history });
  });
}
