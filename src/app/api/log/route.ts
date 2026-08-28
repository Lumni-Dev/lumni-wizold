import { success } from "@/models/entities/result";
import { withGame } from "../_lib/api";

export async function GET(request: Request) {
  return withGame(request, (state) => success(state, "", state.log));
}
