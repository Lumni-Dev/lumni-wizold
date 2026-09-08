import * as alchemyController from "@/controllers/alchemy.controller";
import { asText, withGame } from "../_lib/api";

export async function POST(request: Request) {
  return withGame(request, (state, body) =>
    alchemyController.brewPotion(
      state,
      asText(body.potionId, 60),
      asText(body.first, 60),
      asText(body.second, 60),
    ),
  );
}
