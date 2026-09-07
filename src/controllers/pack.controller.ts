import { normalizeText } from "@/shared/utils/text";
import type { GameState } from "@/models/entities/game-state";
import { MAX_PACK, type PackMate } from "@/models/entities/pack";
import { failure, success, type Result } from "@/models/entities/result";
import type { TavernIdentity } from "@/models/entities/tavern";
import { addLog } from "./log.controller";

export function isInPack(state: GameState, id: string): boolean {
  return state.pack.some((mate) => mate.id === id);
}

export function listPack(state: GameState): PackMate[] {
  return [...state.pack].sort(
    (first, second) => Date.parse(second.addedAt) - Date.parse(first.addedAt),
  );
}

export function addMate(state: GameState, person: TavernIdentity): Result<PackMate> {
  const character = state.character;
  if (!character) return failure(state, "No active character.");

  if (person.id === character.id) return failure(state, "You already walk with yourself.");
  if (isInPack(state, person.id)) {
    return failure(state, person.name + " is already in your pack.");
  }
  if (state.pack.length >= MAX_PACK) {
    return failure(
      state,
      "The pack already has " + MAX_PACK + " names. Remove one before keeping another.",
    );
  }

  const mate: PackMate = {
    id: person.id,
    name: person.name,
    addedAt: new Date().toISOString(),
  };

  const next: GameState = { ...state, pack: [...state.pack, mate] };
  const message = person.name + " joined your pack.";

  return success(addLog(next, "character", message), message, mate);
}

export function matchNick(
  nick: string,
  candidates: readonly TavernIdentity[],
): TavernIdentity | string {
  const term = normalizeText(nick);
  if (term.length === 0) return "Write someone's nick.";

  const exact = candidates.find((person) => normalizeText(person.name) === term);
  if (exact) return exact;

  const partial = candidates.filter((person) => normalizeText(person.name).includes(term));
  if (partial.length === 0) return "No one with that nick in the tavern nor on the board.";
  if (partial.length > 1) {
    return partial.length + " names with that piece. Write the whole nick.";
  }

  return partial[0];
}

export function removeMate(state: GameState, id: string): Result {
  const mate = state.pack.find((current) => current.id === id);
  if (!mate) return failure(state, "That name is not in your pack.");

  const next: GameState = { ...state, pack: state.pack.filter((current) => current.id !== id) };
  const message = mate.name + " left your pack.";

  return success(addLog(next, "character", message), message);
}
