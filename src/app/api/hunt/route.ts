import * as huntController from "@/controllers/hunt.controller";
import { asText, withGame } from "../_lib/api";

// One hunt, one call, atomic: the server resolves the fight with its own
// dice and lands the spoils in the same transaction. The narration the
// client tells afterwards is theater over the returned rounds; nothing it
// does can change what already landed here.
export async function POST(request: Request) {
  return withGame(request, (state, body) => {
    const resolved = huntController.resolveHunt(state, asText(body.territoryId, 60));
    if (!resolved.ok || !resolved.data) return resolved;
    return huntController.landHunt(state, resolved.data, 0);
  });
}
