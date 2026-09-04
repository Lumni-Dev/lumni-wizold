import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  RENAME_COOLDOWN_DAYS,
  REST_HEALTH_RATIO,
  REST_WILLPOWER_HALF,
  REST_WILLPOWER_MAX_BONUS,
} from "@/shared/constants/game";
import { ECONOMY } from "@/shared/config/economy";
import { formatBronze } from "@/shared/utils/format";
import { capitalize } from "@/shared/utils/text";
import { initialState, type GameState } from "@/models/entities/game-state";
import type { Character, Gender } from "@/models/entities/character";
import { failure, success, type Result } from "@/models/entities/result";
import { createRun } from "@/models/factories/character.factory";
import { applyExperience } from "@/models/rules/progression";
import { clampVitals, deriveStats } from "@/models/rules/stats";
import { withMoonBonus } from "@/models/rules/moon";
import { addLog } from "./log.controller";

export function syncCharacter(state: GameState): GameState {
  if (!state.character) return state;
  const stats = deriveStats(state.character, state.equipment, state.pet);
  const clamped = clampVitals(state.character, stats);
  return clamped === state.character ? state : { ...state, character: clamped };
}

export function updateCharacter(
  state: GameState,
  change: (character: Character) => Character,
): GameState {
  if (!state.character) return state;
  return syncCharacter({ ...state, character: change(state.character) });
}

export function capitalizeName(name: string): string {
  return capitalize(name.trim());
}

export function validateName(name: string): string | null {
  const clean = name.trim();
  if (clean.length < NAME_MIN_LENGTH) {
    return "O nick precisa de pelo menos " + NAME_MIN_LENGTH + " letras.";
  }
  if (clean.length > NAME_MAX_LENGTH) {
    return "O nick pode ter no máximo " + NAME_MAX_LENGTH + " letras.";
  }
  if (!/^[\p{L}\p{M}\p{N}]+$/u.test(clean)) {
    return "Um nick de jogo: só letras e números, sem espaço nem sinais.";
  }
  return null;
}

export function startRun(name: string, gender: Gender): Result {
  const problem = validateName(name);
  if (problem) return failure(initialState(), problem);

  return success(createRun(capitalizeName(name), gender), "Personagem criado. A caçada aguarda.");
}

export function renameCost(_level: number): number {
  return ECONOMY.renamePriceBronze;
}

export function renameDaysLeft(character: Character): number {
  if (!character.renamedAt) return 0;

  const dayMs = 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - new Date(character.renamedAt).getTime();
  return Math.max(0, Math.ceil((RENAME_COOLDOWN_DAYS * dayMs - elapsed) / dayMs));
}

export function renameCharacter(state: GameState, name: string): Result {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const problem = validateName(name);
  if (problem) return failure(state, problem);

  const clean = capitalizeName(name);
  if (clean === character.name) return failure(state, "Esse já é o seu nome.");

  const daysLeft = renameDaysLeft(character);
  if (daysLeft > 0) {
    return failure(
      state,
      "O nome só pode trocar de novo em " + daysLeft + (daysLeft > 1 ? " dias." : " dia."),
    );
  }

  const cost = renameCost(character.level);
  if (character.bronze < cost) {
    return failure(
      state,
      "A troca de nome custa " +
        formatBronze(cost) +
        " e faltam " +
        formatBronze(cost - character.bronze) +
        ".",
    );
  }

  const next = updateCharacter(state, (current) => ({
    ...current,
    name: clean,
    bronze: current.bronze - cost,
    renamedAt: new Date().toISOString(),
  }));
  const message = "A matilha agora responde por " + clean + ".";
  return success(addLog(next, "character", message), message);
}

export { furyRemainingMs } from "@/models/rules/moon";

export function sufferBlow(state: GameState, damage: number): Result {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const next = updateCharacter(state, (current) => ({
    ...current,
    health: Math.max(1, current.health - Math.max(0, Math.round(damage))),
  }));
  return success(next, "");
}

export function startRest(state: GameState): Result {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const stats = deriveStats(character, state.equipment, state.pet);
  if (character.health >= stats.maxHealth) {
    return failure(state, "Você já está inteiro.");
  }

  const message = "Você se recolhe. O corpo se regenera aos poucos.";
  return success(addLog(state, "character", message), "");
}

export function restRecoveryRatio(willpower: number): number {
  const value = Math.max(0, willpower);
  return REST_HEALTH_RATIO + REST_WILLPOWER_MAX_BONUS * (value / (value + REST_WILLPOWER_HALF));
}

function restRecovery(maximum: number, willpower: number): number {
  return Math.max(1, Math.ceil(maximum * restRecoveryRatio(willpower)));
}

export function restTick(state: GameState): Result<{ done: boolean; healed: number }> {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const stats = deriveStats(character, state.equipment, state.pet);
  const healthGained =
    Math.min(
      stats.maxHealth,
      character.health + restRecovery(stats.maxHealth, stats.totalAttributes.willpower),
    ) - character.health;

  const next = updateCharacter(state, (current) => ({
    ...current,
    health: current.health + healthGained,
  }));

  const rested = next.character;
  const done = Boolean(rested && rested.health >= stats.maxHealth);

  if (done) {
    const message = "Recuperação completa: vida inteira.";
    return success(addLog(next, "character", message), message, { done, healed: healthGained });
  }

  if (healthGained <= 0) return success(next, "", { done: false, healed: 0 });
  return success(next, "Você regenerou " + healthGained + " de vida.", {
    done: false,
    healed: healthGained,
  });
}

export interface ExperienceGrant {
  state: GameState;
  levels: number;
  granted: number;
}

export function grantExperience(state: GameState, gain: number): ExperienceGrant {
  const granted = withMoonBonus(gain);
  if (!state.character) return { state, levels: 0, granted };

  const { character, levelsGained } = applyExperience(state.character, granted);
  let next = syncCharacter({ ...state, character });

  const leveled = next.character;
  if (levelsGained > 0 && leveled) {
    next = addLog(next, "character", "Nível " + leveled.level + " alcançado.");
  }

  return { state: next, levels: levelsGained, granted };
}
