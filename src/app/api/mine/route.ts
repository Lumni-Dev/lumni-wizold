import * as forgeController from "@/controllers/forge.controller";
import { asText, withGame } from "../_lib/api";

export async function POST(request: Request) {
  return withGame(request, (state, body) => forgeController.mine(state, asText(body.oreId, 60)));
}
