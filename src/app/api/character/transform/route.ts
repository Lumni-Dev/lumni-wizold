import * as characterController from "@/controllers/character.controller";
import { withGame } from "../../_lib/api";
export async function POST(request: Request) {
  return withGame(request, (state) => characterController.toggleForm(state));
}
