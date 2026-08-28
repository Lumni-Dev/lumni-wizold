import * as huntController from "@/controllers/hunt.controller";
import { asText, withGame } from "../_lib/api";
export async function POST(request: Request) {
  return withGame(request, (state, body) => {
    const resolved = huntController.resolveHunt(state, asText(body.territoryId, 60));
    if (!resolved.ok || !resolved.data) return resolved;
    return huntController.landHunt(state, resolved.data, 0);
  });
}
