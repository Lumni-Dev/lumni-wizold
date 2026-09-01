import * as petController from "@/controllers/pet.controller";
import { failure } from "@/models/entities/result";
import { asText, withGame } from "../../_lib/api";
import { moderationRefusal } from "../../_lib/moderation";

export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const name = asText(body.name, 40);
    const blocked = await moderationRefusal(context.client, context.userId, name, "wolf_name");
    if (blocked) return failure(state, blocked);
    return petController.renamePet(state, name);
  });
}
