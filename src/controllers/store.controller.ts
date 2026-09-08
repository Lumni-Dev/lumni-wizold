import { capBronze, formatReais, formatBronze } from "@/shared/utils/format";
import { findPack, STORE_PACKS, type StorePack } from "@/models/data/store-packs";
import type { GameState } from "@/models/entities/game-state";
import { failure, success, type Result } from "@/models/entities/result";
import { packBronze } from "@/models/rules/store";
import { addLog } from "./log.controller";
import { updateCharacter } from "./character.controller";

export interface StoreOffer {
  pack: StorePack;
  bronze: number;
}

export function listPacks(_state: GameState): StoreOffer[] {
  return STORE_PACKS.map((pack) => ({ pack, bronze: packBronze(pack) }));
}

export function purchasePack(state: GameState, packId: string): Result<StoreOffer> {
  const character = state.character;
  if (!character) return failure(state, "No active character.");

  const pack = findPack(packId);
  if (!pack) return failure(state, "That pack no longer exists.");

  const bronze = packBronze(pack);
  const next = updateCharacter(state, (current) => ({
    ...current,
    bronze: capBronze(current.bronze + bronze),
  }));

  const message =
    pack.name +
    " creditado: " +
    formatBronze(bronze) +
    " por " +
    formatReais(pack.priceCents) +
    ".";

  return success(addLog(next, "character", message), message, { pack, bronze });
}

export function applyVipSubscription(
  state: GameState,
  subscriptionId: string,
  periodEndMs: number,
  canceling: boolean,
): Result<{ vipUntil: string }> {
  const character = state.character;
  if (!character) return failure(state, "No active character.");

  const vipUntil = new Date(periodEndMs).toISOString();
  const next = updateCharacter(state, (current) => ({
    ...current,
    vipUntil,
    vipSubscriptionId: subscriptionId,
    vipCanceling: canceling,
  }));
  const message = canceling
    ? "VIP subscription active until the end of the period, not renewing."
    : "VIP active: the subscription renews on its own every month.";

  return success(addLog(next, "character", message), message, { vipUntil });
}

export function setVipCanceling(state: GameState, canceling: boolean): Result {
  const character = state.character;
  if (!character) return failure(state, "No active character.");
  if ((character.vipSubscriptionId ?? "") === "") {
    return failure(state, "You have no active VIP subscription.");
  }

  const next = updateCharacter(state, (current) => ({ ...current, vipCanceling: canceling }));
  const message = canceling
    ? "Subscription canceled: VIP lasts until the end of the paid period and does not renew."
    : "Subscription reactivated: VIP renews on its own again.";

  return success(addLog(next, "character", message), message);
}

export function endVipSubscription(state: GameState): Result {
  const character = state.character;
  if (!character) return failure(state, "No active character.");

  const next = updateCharacter(state, (current) => ({
    ...current,
    vipSubscriptionId: undefined,
    vipCanceling: false,
  }));
  return success(
    addLog(next, "character", "VIP subscription ended."),
    "VIP subscription ended.",
  );
}
