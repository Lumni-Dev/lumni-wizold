import * as petController from "@/controllers/pet.controller";
import { withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, (state) => petController.trainPet(state));
}
