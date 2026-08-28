import { withGame } from "../_lib/api";
import { success } from "@/models/entities/result";

// GET reads the run as it is; POST lets the server clock land what time
// already decided (fury expiry, bazaar sales) and returns the fresh state.
// Opening the game calls POST once, then reads.
export async function GET(request: Request) {
  return withGame(request, (state) => success(state, "", state));
}

export async function POST(request: Request) {
  return withGame(request, (state) => success(state, "", state));
}
