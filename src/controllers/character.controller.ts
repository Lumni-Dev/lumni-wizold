import { huntPurse } from "@/models/data/species";
import {
  MIN_HEALTH_RATIO_TO_ACT,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  RENAME_BASE_PRICE,
  RENAME_COOLDOWN_DAYS,
  REST_RECOVERY_RATIO,
  TRANSFORM_DURATION_MS,
  TRANSFORM_RAGE_COST,
} from "@/shared/constants/game";
import { formatBronze } from "@/shared/utils/format";
import { capitalize } from "@/shared/utils/text";
import { initialState, type GameState } from "@/models/entities/game-state";
import type { Character, Gender } from "@/models/entities/character";
import { failure, success, type Result } from "@/models/entities/result";
import { createRun } from "@/models/factories/character.factory";
import { clampVitals, deriveStats } from "@/models/rules/stats";
import { applyExperience } from "@/models/rules/progression";
import { withMoonBonus } from "@/models/rules/moon";
import { addLog } from "./log.controller";

export function syncCharacter(state: GameState): GameState {
  if (!state.character) return state;
  const stats = deriveStats(state.character, state.equipment, state.pet, state.enhancements);
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

export function renameCost(character: Character): number {
  return Math.max(RENAME_BASE_PRICE, Math.round(huntPurse(character.level) * 30));
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

  const cost = renameCost(character);
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

export function toggleForm(state: GameState): Result {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  if (character.form === "werewolf") {
    const next = updateCharacter(state, (current) => ({
      ...current,
      form: "human",
      transformedAt: undefined,
    }));
    const message = "Você recolhe a fera e volta à forma humana.";
    return success(addLog(next, "character", message), message);
  }

  if (character.rage < TRANSFORM_RAGE_COST) {
    return failure(
      state,
      "Fúria insuficiente. São necessários " + TRANSFORM_RAGE_COST + " pontos.",
    );
  }

  const floor =
    deriveStats(character, state.equipment, state.pet, state.enhancements).maxHealth *
    MIN_HEALTH_RATIO_TO_ACT;
  if (character.health <= floor) {
    return failure(state, "Vida baixa demais para transformar. Recupere-se ou beba uma poção.");
  }

  const next = updateCharacter(state, (current) => ({
    ...current,
    form: "werewolf",
    rage: current.rage - TRANSFORM_RAGE_COST,
    transformedAt: new Date().toISOString(),
  }));
  const message = "Você se transforma. Ossos estalam, o pelo sobe.";
  return success(addLog(next, "character", message), message);
}

export function transformationRemainingMs(character: Character): number {
  if (character.form !== "werewolf" || !character.transformedAt) return 0;
  const elapsed = Date.now() - new Date(character.transformedAt).getTime();
  return Math.max(0, TRANSFORM_DURATION_MS - elapsed);
}

export function expireTransformation(state: GameState): Result {
  const character = state.character;
  if (!character || character.form !== "werewolf") return success(state, "");
  if (transformationRemainingMs(character) > 0) return success(state, "");

  const next = updateCharacter(state, (current) => ({
    ...current,
    form: "human",
    transformedAt: undefined,
  }));
  const message = "Sua fúria se esgotou, você voltou à forma humana.";
  return success(addLog(next, "character", message), message);
}

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

  const stats = deriveStats(character, state.equipment, state.pet, state.enhancements);
  if (character.health >= stats.maxHealth && character.rage >= stats.maxRage) {
    return failure(state, "Você já está inteiro.");
  }

  const next = updateCharacter(state, (current) => ({
    ...current,
    form: "human",
    transformedAt: undefined,
  }));
  const message = "Você se recolhe. O corpo se regenera aos poucos.";
  return success(addLog(next, "character", message), message);
}

function restRecovery(maximum: number): number {
  return Math.max(1, Math.ceil(maximum * REST_RECOVERY_RATIO));
}

export function restTick(state: GameState): Result<{ done: boolean }> {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const stats = deriveStats(character, state.equipment, state.pet, state.enhancements);
  const healthGained =
    Math.min(stats.maxHealth, character.health + restRecovery(stats.maxHealth)) - character.health;
  const rageGained =
    Math.min(stats.maxRage, character.rage + restRecovery(stats.maxRage)) - character.rage;

  const next = updateCharacter(state, (current) => ({
    ...current,
    health: current.health + healthGained,
    rage: current.rage + rageGained,
  }));

  const rested = next.character;
  const done = Boolean(rested && rested.health >= stats.maxHealth && rested.rage >= stats.maxRage);

  if (done) {
    const message = "Recuperação completa: vida e fúria inteiras.";
    return success(addLog(next, "character", message), message, { done });
  }

  const gains = [
    healthGained > 0 ? healthGained + " de vida" : "",
    rageGained > 0 ? rageGained + " de fúria" : "",
  ].filter((part) => part.length > 0);

  if (gains.length === 0) return success(next, "", { done: false });
  return success(next, "Você regenerou " + gains.join(" e ") + ".", { done: false });
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
