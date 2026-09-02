import { success } from "@/models/entities/result";
import { markTutorialDone } from "@/models/repositories/server/user.store";
import { withGame } from "../_lib/api";

export async function POST(request: Request) {
  return withGame(request, async (state, _body, context) => {
    await markTutorialDone(context.client, context.userId);
    return success(state, "", { tutorial: true });
  });
}
