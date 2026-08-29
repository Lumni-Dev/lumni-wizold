import { failure } from "@/models/entities/result";
import { loadNames } from "@/models/repositories/server/roster.store";
import * as packController from "@/controllers/pack.controller";
import { asText, withGame } from "../_lib/api";
export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const names = await loadNames(context.client);
    const id = asText(body.id, 80);
    if (id) {
      const known = names.find((entry) => entry.id === id);
      if (!known) return failure(state, "Esse caçador não está no registro.");
      return packController.addMate(state, { id: known.id, name: known.name });
    }
    return packController.addByNick(state, asText(body.nick, 60), names);
  });
}
