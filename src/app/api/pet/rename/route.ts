import * as petController from "@/controllers/pet.controller";
import { asText, withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, (state, body) =>
    petController.renamePet(state, asText(body.name, 40)),
  );
}
