import { success } from "@/models/entities/result";
import { loadOthersListings } from "@/models/repositories/server/bazaar.store";
import * as bazaarController from "@/controllers/bazaar.controller";
import { withGame } from "../_lib/api";

export async function GET(request: Request) {
  return withGame(request, async (state, _body, context) => {
    const others = await loadOthersListings(context.client, context.characterId);
    return success(state, "", {
      board: bazaarController.listBoard(state, others),
      sellable: bazaarController.listSellable(state),
      wallet: state.wallet,
    });
  });
}
