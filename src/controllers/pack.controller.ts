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
  if (!character) return failure(state, "Nenhum personagem ativo.");

  if (person.id === character.id) return failure(state, "Você já anda com você mesmo.");
  if (isInPack(state, person.id)) {
    return failure(state, person.name + " já está na sua matilha.");
  }
  if (state.pack.length >= MAX_PACK) {
    return failure(
      state,
      "A matilha já tem " + MAX_PACK + " nomes. Exclua um antes de guardar outro.",
    );
  }

  const mate: PackMate = {
    id: person.id,
    name: person.name,
    addedAt: new Date().toISOString(),
  };

  const next: GameState = { ...state, pack: [...state.pack, mate] };
  const message = person.name + " entrou para a sua matilha.";

  return success(addLog(next, "character", message), message, mate);
}

export function matchNick(
  nick: string,
  candidates: readonly TavernIdentity[],
): TavernIdentity | string {
  const term = normalizeText(nick);
  if (term.length === 0) return "Escreva o nick de alguém.";

  const exact = candidates.find((person) => normalizeText(person.name) === term);
  if (exact) return exact;

  const partial = candidates.filter((person) => normalizeText(person.name).includes(term));
  if (partial.length === 0) return "Ninguém com esse nick na taverna nem no quadro.";
  if (partial.length > 1) {
    return partial.length + " nomes com esse pedaço. Escreva o nick inteiro.";
  }

  return partial[0];
}

export function removeMate(state: GameState, id: string): Result {
  const mate = state.pack.find((current) => current.id === id);
  if (!mate) return failure(state, "Esse nome não está na sua matilha.");

  const next: GameState = { ...state, pack: state.pack.filter((current) => current.id !== id) };
  const message = mate.name + " saiu da sua matilha.";

  return success(addLog(next, "character", message), message);
}
