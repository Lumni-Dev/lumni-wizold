import * as trainingController from "@/controllers/training.controller";
import { asText, withGame } from "../../_lib/api";
export async function POST(request: Request) {
  return withGame(request, (state, body) =>
    trainingController.train(state, asText(body.exerciseId, 60)),
  );
}
