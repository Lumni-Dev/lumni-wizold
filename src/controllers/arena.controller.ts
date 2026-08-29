import { MIN_HEALTH_RATIO_TO_ACT } from "@/shared/constants/game";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { defaultRandom, pickOne, type Random } from "@/shared/utils/random";
import { normalizeText } from "@/shared/utils/text";
import type { LevelBand } from "@/models/entities/creature";
import type { GameState } from "@/models/entities/game-state";
import type { Hunter } from "@/models/entities/ranking";
import { failure, success, type Result } from "@/models/entities/result";
import {
  arenaBand,
  arenaCharges,
  arenaCombatant,
  arenaCooldownLeft,
  arenaSpoils,
  arenaSpoilsRange,
  arenaStats,
  isInBand,
  type ArenaCharges,
  type SpoilsRange,
} from "@/models/rules/arena";
import { simulateCombat, type CombatOpponent, type CombatOutcome } from "@/models/rules/combat";
import { canPetFight, spendPetEnergy } from "@/models/rules/pet";
import { deriveStats, type DerivedStats } from "@/models/rules/stats";
import { syncCharacter } from "./character.controller";
import { addLog } from "./log.controller";
export interface ArenaRival {
  hunter: Hunter;
  stats: DerivedStats;
  inBand: boolean;
  cooldownLeft: number;
  spoils: SpoilsRange;
}
export function formatCooldown(milliseconds: number): string {
  const minutes = Math.ceil(milliseconds / 60000);
  return minutes >= 60 ? Math.ceil(minutes / 60) + "h" : minutes + "min";
}
export interface ArenaView {
  band: LevelBand;
  rivals: ArenaRival[];
  bandSize: number;
  spoils: SpoilsRange;
  charges: ArenaCharges;
  hasHealth: boolean;
  ready: boolean;
  transformed: boolean;
  canFight: boolean;
  reason: string | null;
}
function asRival(hunter: Hunter, band: LevelBand, state: GameState, now: number): ArenaRival {
  return {
    hunter,
    stats: arenaStats(hunter),
    inBand: isInBand(band, hunter.level),
    cooldownLeft: arenaCooldownLeft(state.arenaDuels[hunter.id], now),
    spoils: arenaSpoilsRange(hunter.level),
  };
}
export function listArena(
  state: GameState,
  roster: readonly Hunter[],
  search = "",
  now = Date.now(),
): ArenaView {
  const character = state.character;
  if (!character) {
    return {
      band: { start: 1, end: 1 },
      rivals: [],
      bandSize: 0,
      spoils: { min: 0, max: 0 },
      charges: { left: 0, used: 0, returnsIn: 0 },
      hasHealth: false,
      ready: false,
      transformed: false,
      canFight: false,
      reason: "Nenhum personagem ativo.",
    };
  }
  const band = arenaBand(character.level);
  const stats = deriveStats(character, state.equipment, state.pet, state.enhancements);
  const healthy = character.health > stats.maxHealth * MIN_HEALTH_RATIO_TO_ACT;
  const transformed = character.form === "werewolf";
  const charges = arenaCharges(state.arenaDuels, now);
  const ready = healthy && charges.left > 0;
  const pit = roster.filter((hunter) => hunter.id !== character.id);
  const term = normalizeText(search);
  const found = term
    ? pit.filter((hunter) => normalizeText(hunter.name).includes(term))
    : pit.filter((hunter) => isInBand(band, hunter.level));
  const rivals = found
    .map((hunter) => asRival(hunter, band, state, now))
    .sort((first, second) => {
      if (first.inBand !== second.inBand) return first.inBand ? -1 : 1;
      const firstResting = first.cooldownLeft > 0;
      const secondResting = second.cooldownLeft > 0;
      if (firstResting !== secondResting) return firstResting ? 1 : -1;
      return (
        Math.abs(first.hunter.level - character.level) -
        Math.abs(second.hunter.level - character.level)
      );
    });
  return {
    band,
    rivals,
    bandSize: pit.filter((hunter) => isInBand(band, hunter.level)).length,
    spoils: arenaSpoilsRange(character.level),
    charges,
    hasHealth: healthy,
    ready,
    transformed,
    canFight: ready && transformed,
    reason: !healthy
      ? "Vida baixa demais para subir na arena. Recupere-se ou use uma poção."
      : charges.left === 0
        ? "Os três ataques do dia acabaram: o próximo volta em " +
          formatCooldown(charges.returnsIn) +
          "."
        : !transformed
          ? "Só a fera desce ao fosso. Transforme-se antes de descer."
          : null,
  };
}
function nearestByLevel(pit: readonly Hunter[], level: number, amount: number): Hunter[] {
  return [...pit]
    .sort((first, second) => Math.abs(first.level - level) - Math.abs(second.level - level))
    .slice(0, amount);
}
export function drawOpponent(
  state: GameState,
  roster: readonly Hunter[],
  random: Random = defaultRandom,
  now = Date.now(),
): Hunter | null {
  const character = state.character;
  if (!character) return null;
  const pit = roster.filter((hunter) => hunter.id !== character.id);
  const rested = (hunter: Hunter) => arenaCooldownLeft(state.arenaDuels[hunter.id], now) === 0;
  const band = arenaBand(character.level);
  const inBand = pit.filter((hunter) => isInBand(band, hunter.level) && rested(hunter));
  const pool = inBand.length > 0 ? inBand : nearestByLevel(pit, character.level, 5).filter(rested);
  return pool.length > 0 ? pickOne(pool, random) : null;
}
export interface ArenaResolution {
  hunter: Hunter;
  foe: CombatOpponent;
  combat: CombatOutcome;
  spoils: number;
  healthLost: number;
}
export function resolveArena(
  state: GameState,
  roster: readonly Hunter[],
  hunterId: string,
  random: Random = defaultRandom,
  now = Date.now(),
): Result<ArenaResolution> {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");
  const hunter = roster.find(
    (candidate) => candidate.id === hunterId && candidate.id !== character.id,
  );
  if (!hunter) return failure(state, "Esse caçador não está no fosso.");
  const charges = arenaCharges(state.arenaDuels, now);
  if (charges.left === 0) {
    return failure(
      state,
      "Os três ataques do dia acabaram: o próximo volta em " +
        formatCooldown(charges.returnsIn) +
        ".",
    );
  }
  if (character.form !== "werewolf") {
    return failure(state, "Só a fera desce ao fosso. Transforme-se antes de descer.");
  }
  const band = arenaBand(character.level);
  const pit = roster.filter((candidate) => candidate.id !== character.id);
  const bandHasRivals = pit.some((candidate) => isInBand(band, candidate.level));
  const nearest = bandHasRivals ? [] : nearestByLevel(pit, character.level, 5);
  if (
    !isInBand(band, hunter.level) &&
    !nearest.some((candidate) => candidate.id === hunter.id)
  ) {
    return failure(
      state,
      "A arena só marca luta entre NV. " +
        formatNumber(band.start) +
        " e NV. " +
        formatNumber(band.end) +
        ".",
    );
  }
  const resting = arenaCooldownLeft(state.arenaDuels[hunter.id], now);
  if (resting > 0) {
    return failure(
      state,
      hunter.name + " ainda se recupera do último duelo: faltam " + formatCooldown(resting) + ".",
    );
  }
  const stats = deriveStats(character, state.equipment, state.pet, state.enhancements);
  if (character.health <= stats.maxHealth * MIN_HEALTH_RATIO_TO_ACT) {
    return failure(state, "Vida baixa demais para subir na arena. Recupere-se ou use uma poção.");
  }
  const foe = arenaCombatant(hunter);
  const ally = canPetFight(state.pet) ? state.pet : null;
  const foePet = hunter.pet && hunter.pet.active && hunter.pet.energy > 0 ? hunter.pet : null;
  const combat = simulateCombat({
    characterName: character.name,
    currentHealth: character.health,
    currentRage: character.rage,
    stats,
    creature: foe,
    pet: ally ? { name: ally.name, energy: ally.energy } : null,
    foePet: foePet ? { name: foePet.name, energy: foePet.energy } : null,
    random,
  });
  return success<ArenaResolution>(state, "", {
    hunter,
    foe,
    combat,
    spoils: combat.victory
      ? arenaSpoils(hunter.level, hunter.bronze, random)
      : combat.retreated
        ? 0
        : -arenaSpoils(hunter.level, character.bronze, random),
    healthLost: character.health - Math.max(1, combat.finalHealth),
  });
}
export function landArena(
  state: GameState,
  resolution: ArenaResolution,
  alreadyBled = 0,
  now = Date.now(),
): Result<ArenaResolution> {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");
  const { combat, hunter, spoils } = resolution;
  const remainingLoss = Math.max(0, resolution.healthLost - Math.max(0, alreadyBled));
  const lost = !combat.victory && !combat.retreated;
  const duels: Record<string, string> = {};
  for (const [id, at] of Object.entries(state.arenaDuels)) {
    if (arenaCooldownLeft(at, now) > 0) duels[id] = at;
  }
  duels[hunter.id] = new Date(now).toISOString();
  let next: GameState = {
    ...state,
    arenaDuels: duels,
    pet: state.pet && combat.petSpent > 0 ? spendPetEnergy(state.pet, combat.petSpent) : state.pet,
    character: {
      ...character,
      form: lost ? "human" : character.form,
      transformedAt: lost ? undefined : character.transformedAt,
      health: Math.max(1, character.health - remainingLoss),
      rage: character.rage + combat.rageGained,
      bronze: Math.max(0, character.bronze + spoils),
      arenaWins: character.arenaWins + (combat.victory ? 1 : 0),
      arenaLosses: character.arenaLosses + (lost ? 1 : 0),
    },
  };
  next = syncCharacter(next);
  const message = combat.victory
    ? spoils > 0
      ? hunter.name + " cai no fosso, e a bolsa vem junto: " + formatBronze(spoils) + "."
      : hunter.name + " cai no fosso, mas desceu sem uma moeda no bolso."
    : combat.retreated
      ? "O duelo com " + hunter.name + " se arrastou e os dois recuaram. Ninguém levou nada."
      : spoils < 0
        ? hunter.name +
          " leva a melhor no fosso, e leva também " +
          formatBronze(-spoils) +
          " da sua bolsa."
        : hunter.name + " leva a melhor no fosso. Sua bolsa estava vazia, e foi o que ele levou.";
  const humbled = lost ? message + " A fera não se sustentou: você volta à forma humana." : message;
  next = addLog(next, "arena", humbled);
  return success<ArenaResolution>(next, humbled, resolution);
}
