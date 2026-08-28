import { success } from "@/models/entities/result";
import * as storeController from "@/controllers/store.controller";
import { withGame } from "../_lib/api";

export async function GET(request: Request) {
  return withGame(request, (state) => success(state, "", storeController.listPacks(state)));
}
