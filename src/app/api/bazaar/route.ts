import { success } from "@/models/entities/result";
import * as bazaarController from "@/controllers/bazaar.controller";
import { withGame } from "../_lib/api";

export async function GET(request: Request) {
  return withGame(request, (state) =>
    success(state, "", {
      board: bazaarController.listBoard(state),
      sellable: bazaarController.listSellable(state),
      wallet: state.wallet,
    }),
  );
}
