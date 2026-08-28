import * as characterController from "@/controllers/character.controller";
import { withGame } from "../../_lib/api";

// Turning and turning back share the one gate the whole game respects: rage
// to pay, health above the floor, and the stamp the server clock expires.
export async function POST(request: Request) {
  return withGame(request, (state) => characterController.toggleForm(state));
}
