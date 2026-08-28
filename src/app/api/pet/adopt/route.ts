import * as petController from "@/controllers/pet.controller";
import type { PetGender } from "@/models/entities/pet";
import { asText, withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, (state, body) => {
    const gender: PetGender = body.gender === "female" ? "female" : "male";
    return petController.adoptPet(state, gender, asText(body.name, 40));
  });
}
