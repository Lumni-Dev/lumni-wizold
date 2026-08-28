import { success } from "@/models/entities/result";
import { loadHunters } from "@/models/repositories/server/roster.store";
import { withGame } from "../_lib/api";

export async function GET(request: Request) {
  return withGame(request, async (state, _body, context) => {
    const hunters = await loadHunters(context.client);
    return success(state, "", { hunters });
  });
}
