import * as characterController from "@/controllers/character.controller";
import { failure } from "@/models/entities/result";
import { nameTaken } from "@/models/repositories/server/game.store";
import { asText, withGame } from "../../_lib/api";
import { moderationRefusal } from "../../_lib/moderation";

export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const name = asText(body.name, 40).trim();
    const blocked = await moderationRefusal(context.client, context.userId, name, "hunter_name");
    if (blocked) return failure(state, blocked);
    if (name && (await nameTaken(context.client, name, context.characterId))) {
      return failure(state, "Esse nome já é de outro caçador. Escolha outro.");
    }
    return characterController.renameCharacter(state, name);
  });
}
