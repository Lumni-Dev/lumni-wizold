import { MIN_HEALTH_RATIO_TO_ACT } from "@/shared/constants/game";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { chance, defaultRandom, intBetween, type Random } from "@/shared/utils/random";
import { findCreature } from "@/models/data/creatures";
import { speciesNumbers } from "@/models/data/species";
import { findItem, itemIdFor } from "@/models/data/items";
import { findTerritory, TERRITORIES } from "@/models/data/territories";
import type { Gender } from "@/models/entities/character";
import type { Creature } from "@/models/entities/creature";
import type { GameState } from "@/models/entities/game-state";
import { failure, success, type Result } from "@/models/entities/result";
import type { Territory } from "@/models/entities/territory";
import { simulateCombat, type CombatOutcome } from "@/models/rules/combat";
import {
  growPet,
  isPetHunting,
  petHuntEffort,
  petLevelOf,
  spendPetEnergy,
} from "@/models/rules/pet";
import { deriveStats } from "@/models/rules/stats";
import { gainItems } from "./inventory.controller";
import { grantExperience, syncCharacter } from "./character.controller";
import { addLog } from "./log.controller";

export interface AvailableTerritory {
  territory: Territory;
  creatures: Creature[];
  prey: Creature | null;
  unlocked: boolean;
  hasHealth: boolean;
  transformed: boolean;
  reason: string | null;
}

export interface DropObtained {
  itemId: string;
  name: string;
  quantity: number;
}

export interface HuntResolution {
  territory: Territory;
  creature: Creature;
  combat: CombatOutcome;
  bronze: number;
  drops: DropObtained[];
  baseExperience: number;
  healthLost: number;
}

export interface HuntReport extends HuntResolution {
  experience: number;
  levelsGained: number;
  petEffort: number;
  petLeveled: boolean;
}

function creaturesOf(territory: Territory): Creature[] {
  return territory.creatures
    .map((creatureId) => findCreature(creatureId))
    .filter((creature): creature is Creature => Boolean(creature))
    .sort((a, b) => a.level - b.level);
}

function pickCreature(territory: Territory, level: number): Creature | undefined {
  const creatures = creaturesOf(territory);
  if (creatures.length === 0) return undefined;

  const eligible = creatures.filter((creature) => creature.level <= level);
  return eligible[eligible.length - 1] ?? creatures[0];
}

function scaledPrey(territory: Territory, level: number): Creature | undefined {
  const variant = pickCreature(territory, level);
  if (!variant) return undefined;

  const preyLevel = Math.min(Math.max(level, variant.level), territory.maxLevel);
  return { ...variant, level: preyLevel, ...speciesNumbers(variant.species, preyLevel) };
}

export function listTerritories(state: GameState): AvailableTerritory[] {
  const character = state.character;
  const stats = character
    ? deriveStats(character, state.equipment, state.pet, state.enhancements)
    : null;

  return TERRITORIES.map((territory) => {
    const creatures = creaturesOf(territory);

    const unlocked = character !== null && character.level >= territory.minLevel;
    const hasHealth =
      character !== null &&
      stats !== null &&
      character.health > stats.maxHealth * MIN_HEALTH_RATIO_TO_ACT;
    const transformed = character !== null && character.form === "werewolf";

    return {
      territory,
      creatures,
      prey: character ? (scaledPrey(territory, character.level) ?? null) : null,
      unlocked,
      hasHealth,
      transformed,
      reason: !unlocked
        ? "Requer NV. " + territory.minLevel
        : !hasHealth
          ? "Vida baixa demais"
          : !transformed
            ? "Só a fera caça"
            : null,
    };
  });
}

function rollDrops(creature: Creature, lineage: Gender, random: Random): DropObtained[] {
  const obtained: DropObtained[] = [];

  for (const drop of creature.drops) {
    if (!chance(drop.chance, random)) continue;
    const item = findItem(itemIdFor(drop.itemId, lineage));
    if (!item) continue;
    obtained.push({
      itemId: item.id,
      name: item.name,
      quantity: intBetween(drop.minimum, drop.maximum, random),
    });
  }

  return obtained;
}

export function resolveHunt(
  state: GameState,
  territoryId: string,
  random: Random = defaultRandom,
): Result<HuntResolution> {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const territory = findTerritory(territoryId);
  if (!territory) return failure(state, "Território desconhecido.");
  if (character.level < territory.minLevel) {
    return failure(state, territory.name + " exige NV. " + territory.minLevel + ".");
  }

  if (character.form !== "werewolf") {
    return failure(state, "Só a fera caça. Transforme-se antes de subir a trilha.");
  }

  const stats = deriveStats(character, state.equipment, state.pet, state.enhancements);
  if (character.health <= stats.maxHealth * MIN_HEALTH_RATIO_TO_ACT) {
    return failure(state, "Vida baixa demais para caçar. Recupere-se ou use uma poção.");
  }

  const creature = scaledPrey(territory, character.level);
  if (!creature) return failure(state, "A trilha não levou a nada.");

  const petJoining = isPetHunting(state.pet) ? state.pet : null;
  const combat = simulateCombat({
    characterName: character.name,
    currentHealth: character.health,
    currentRage: character.rage,
    stats,
    creature,
    pet: petJoining ? { name: petJoining.name, energy: petJoining.energy } : null,
    random,
  });

  const baseExperience = combat.victory
    ? creature.experience
    : Math.round(creature.experience * 0.2);
  const bronze = combat.victory ? intBetween(creature.minBronze, creature.maxBronze, random) : 0;
  const drops = combat.victory ? rollDrops(creature, character.gender, random) : [];

  return success<HuntResolution>(state, "", {
    territory,
    creature,
    combat,
    bronze,
    drops,
    baseExperience,
    healthLost: character.health - Math.max(1, combat.finalHealth),
  });
}

export function landHunt(
  state: GameState,
  resolution: HuntResolution,
  alreadyBled = 0,
): Result<HuntReport> {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const { combat, creature, territory, bronze, drops } = resolution;
  const remainingLoss = Math.max(0, resolution.healthLost - Math.max(0, alreadyBled));

  const lost = !combat.victory && !combat.retreated;

  const tired =
    state.pet && combat.petSpent > 0 ? spendPetEnergy(state.pet, combat.petSpent) : state.pet;

  const along = isPetHunting(state.pet);
  const grown = along && tired ? growPet(tired, petHuntEffort(petLevelOf(tired))) : null;
  const pet = grown ? grown.pet : tired;

  let next: GameState = {
    ...state,
    character: {
      ...character,
      health: Math.max(1, character.health - remainingLoss),
      rage: character.rage + combat.rageGained,
      bronze: character.bronze + bronze,
      hunts: character.hunts + 1,
      wins: character.wins + (combat.victory ? 1 : 0),
      losses: character.losses + (lost ? 1 : 0),
    },
    pet,
  };

  next = syncCharacter(next);
  next = gainItems(
    next,
    drops.map((drop) => ({ itemId: drop.itemId, quantity: drop.quantity })),
  );

  const {
    state: withExperience,
    levels,
    granted,
  } = grantExperience(next, resolution.baseExperience);
  next = withExperience;

  const loot = [formatBronze(bronze), formatNumber(granted) + " de experiência"]
    .concat(drops.map((drop) => drop.name + " x" + drop.quantity))
    .join(", ");

  const message = combat.victory
    ? creature.name + " caiu em " + territory.name + ". Conquistas: " + loot + "."
    : combat.retreated
      ? "A luta contra " +
        creature.name +
        " se arrastou e você recuou de " +
        territory.name +
        ". Pelo esforço: " +
        formatNumber(granted) +
        " de experiência."
      : creature.name +
        " venceu a disputa. Você escapou por pouco de " +
        territory.name +
        ". Pelo esforço: " +
        formatNumber(granted) +
        " de experiência.";

  next = addLog(next, "hunt", message);

  if (grown?.leveled && pet) {
    const climbed = pet.name + " sobe para NV. " + formatNumber(petLevelOf(pet)) + ".";
    next = addLog(next, "training", climbed);
  }

  return success<HuntReport>(next, message, {
    ...resolution,
    experience: granted,
    levelsGained: levels,
    petEffort: along ? petHuntEffort(petLevelOf(state.pet)) : 0,
    petLeveled: grown?.leveled === true,
  });
}
