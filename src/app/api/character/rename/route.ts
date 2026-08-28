import * as characterController from "@/controllers/character.controller";
import { asText, withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, (state, body) =>
    characterController.renameCharacter(state, asText(body.name, 40)),
  );
}
