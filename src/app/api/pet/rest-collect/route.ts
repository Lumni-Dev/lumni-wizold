import { REST_TICK_MS } from "@/shared/constants/game";
import * as petController from "@/controllers/pet.controller";
import { success } from "@/models/entities/result";
import { setPetRestCollectedAt } from "@/models/repositories/server/game.store";
import { withGame } from "../../_lib/api";
export async function POST(request: Request) {
  return withGame(request, async (state, _body, context) => {
    if (!state.pet) return { ok: false, message: "Você não tem mascote.", state };
    const since = context.loaded.petRestCollectedAt;
    if (state.pet.active !== false || !since) {
      return { ok: false, message: state.pet.name + " não está em repouso.", state };
    }
    const entitled = Math.floor((Date.now() - Date.parse(since)) / REST_TICK_MS);
    if (entitled <= 0) return success(state, "", { whole: false, ticks: 0 });
    let current = state;
    let whole = false;
    let ticks = 0;
    for (; ticks < entitled && !whole; ticks += 1) {
      const tick = petController.restPetTick(current);
      if (!tick.ok) break;
      current = tick.state;
      whole = tick.data?.whole === true;
    }
    await setPetRestCollectedAt(
      context.client,
      context.characterId,
      new Date(Date.parse(since) + ticks * REST_TICK_MS).toISOString(),
    );
    return success(
      current,
      whole && current.pet ? current.pet.name + " está de pé, inteiro e pronto." : "",
      {
        whole,
        ticks,
      },
    );
  });
}
