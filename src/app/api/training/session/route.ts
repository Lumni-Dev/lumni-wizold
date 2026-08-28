import * as trainingController from "@/controllers/training.controller";
import { asText, withGame } from "../../_lib/api";

// One click, one session: the endpoint IS the session, so chaining lives in
// whoever calls it and the beast-only, cost and cap rules live in the use case.
export async function POST(request: Request) {
  return withGame(request, (state, body) =>
    trainingController.train(state, asText(body.exerciseId, 60)),
  );
}
