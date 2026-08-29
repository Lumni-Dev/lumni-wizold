import { withGame } from "../_lib/api";
import { success } from "@/models/entities/result";
export async function POST(request: Request) {
  return withGame(request, (state) => success(state, "", state));
}
