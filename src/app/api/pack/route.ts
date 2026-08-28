import { success } from "@/models/entities/result";
import { loadNames } from "@/models/repositories/server/roster.store";
import * as packController from "@/controllers/pack.controller";
import { asText, withGame } from "../_lib/api";
export async function GET(request: Request) {
  return withGame(request, (state) => success(state, "", packController.listPack(state)));
}
export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const id = asText(body.id, 80);
    const name = asText(body.name, 60);
    if (id && name) return packController.addMate(state, { id, name });
    const names = await loadNames(context.client);
    return packController.addByNick(state, asText(body.nick, 60), names);
  });
}
