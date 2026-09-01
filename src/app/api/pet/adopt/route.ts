import * as petController from "@/controllers/pet.controller";
import type { PetGender } from "@/models/entities/pet";
import { failure } from "@/models/entities/result";
import { asText, withGame } from "../../_lib/api";
import { moderationRefusal } from "../../_lib/moderation";

export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const gender: PetGender = body.gender === "female" ? "female" : "male";
    const name = asText(body.name, 40);
    const blocked = await moderationRefusal(context.client, context.userId, name, "wolf_name");
    if (blocked) return failure(state, blocked);
    return petController.adoptPet(state, gender, name);
  });
}
