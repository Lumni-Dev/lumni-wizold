import { success } from "@/models/entities/result";
import * as marketController from "@/controllers/market.controller";
import { withGame } from "../_lib/api";

export async function GET(request: Request) {
  return withGame(request, (state) => success(state, "", marketController.listOffers(state)));
}
