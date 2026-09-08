import {
  CRITICAL_DAMAGE_BONUS,
  MAX_COMBAT_ROUNDS,
  PET_ATTACK_RATIO,
  PET_ENERGY_PER_BLOW,
  PET_BITE_ENERGY,
  PET_ENERGY_PER_HUNT,
  PET_TARGET_CHANCE,
} from "@/shared/constants/game";
import { chance, defaultRandom, pickOne, spread, type Random } from "@/shared/utils/random";
import { clamp } from "@/shared/utils/format";
import type { DerivedStats } from "./stats";

export interface CombatOpponent {
  name: string;
  health: number;

  strength: number;
  endurance: number;
  agility: number;
}

export type BlowAuthor = "character" | "creature" | "pet";

export interface CombatRound {
  index: number;
  author: BlowAuthor;
  damage: number;
  critical: boolean;
  dodged: boolean;
  characterHealth: number;
  creatureHealth: number;
  text: string;
  /** Second blow in the same cycle, paid by agility. */
  extraStrike?: boolean;
}

export interface CombatOutcome {
  victory: boolean;
  retreated: boolean;
  rounds: CombatRound[];
  finalHealth: number;
  damageDealt: number;
  damageTaken: number;

  petBlows: number;

  petSpent: number;
}

export function hunterWon(combat: CombatOutcome): boolean {
  return combat.victory;
}

export function hunterRetreated(combat: CombatOutcome): boolean {
  return combat.retreated;
}

export interface CombatPet {
  name: string;
  energy: number;
}

interface CombatInput {
  characterName: string;
  currentHealth: number;
  stats: DerivedStats;
  creature: CombatOpponent;
  pet?: CombatPet | null;
  foePet?: CombatPet | null;
  random?: Random;
}

const CREATURE_CRITICAL_CHANCE = 0.1;
const PET_CRITICAL_CHANCE = 5;

const CRITICAL_MULTIPLIER = 1.5;

/** Hard ceiling (%) so a NV 1000 glass cannon never doubles almost every cycle. */
export const EXTRA_STRIKE_CAP = 12;

/**
 * Chance (%) of one extra blow in the same cycle.
 * Soft absolute term (AGI still helps vs equals) plus lead over the foe;
 * both asymptote under EXTRA_STRIKE_CAP.
 */
export function extraStrikeChance(attackerAgi: number, defenderAgi: number): number {
  const agi = Math.max(0, attackerAgi);
  const lead = Math.max(0, agi - Math.max(0, defenderAgi));
  const absolute = (3 * agi) / (agi + 400);
  const relative = (10 * lead) / (lead + 180);
  return clamp(Math.round(absolute + relative), 0, EXTRA_STRIKE_CAP);
}

const CHARACTER_HIT_VERBS = [" strikes ", " bites ", " sinks its claws into ", " batters "];
const CHARACTER_CRIT_VERBS = [" tears into ", " shreds ", " rips open "];
const CHARACTER_EXTRA_VERBS = [" strikes again ", " flashes a second blow at ", " lunges twice into "];
const CREATURE_HIT_VERBS = [" hits ", " strikes ", " sinks its teeth into "];
const CREATURE_CRIT_VERBS = [" mauls ", " tears into "];
const CREATURE_EXTRA_VERBS = [" strikes again ", " hits again ", " lunges a second time at "];
const PET_HIT_VERBS = [" bites ", " lunges at ", " tears the flank of "];

function creatureDodgeText(creatureName: string, characterName: string, random: Random): string {
  return pickOne(
    [
      creatureName + " dodges the blow of " + characterName + ".",
      creatureName + " escapes the claws of " + characterName + " by a hair.",
      "The pounce of " + characterName + " grazes past " + creatureName + ".",
    ],
    random,
  );
}

function characterDodgeText(characterName: string, creatureName: string, random: Random): string {
  return pickOne(
    [
      characterName + " escapes the pounce of " + creatureName + ".",
      characterName + " rolls away from the attack of " + creatureName + ".",
      "The blow of " + creatureName + " cuts only wind.",
    ],
    random,
  );
}

function creatureDodge(creature: CombatOpponent): number {
  return clamp(Math.round((30 * creature.agility) / (creature.agility + 120)), 0, 30);
}

export function criticalMultiplierOf(): number {
  return CRITICAL_MULTIPLIER + CRITICAL_DAMAGE_BONUS;
}

function calculateDamage(
  strength: number,
  endurance: number,
  critical: boolean,
  random: Random,
  criticalMultiplier: number = CRITICAL_MULTIPLIER,
): number {
  const raw = strength * spread(0.1, random);
  const mitigated = (raw * raw) / (raw + Math.max(0, endurance));
  const total = critical ? mitigated * criticalMultiplier : mitigated;
  return Math.max(1, Math.round(total));
}

export function simulateCombat({
  characterName,
  currentHealth,
  stats,
  creature,
  pet = null,
  foePet = null,
  random = defaultRandom,
}: CombatInput): CombatOutcome {
  const criticalChance = stats.critical;
  const criticalMultiplier = criticalMultiplierOf();

  const rounds: CombatRound[] = [];
  let characterHealth = currentHealth;
  let creatureHealth = creature.health;
  let damageDealt = 0;
  let damageTaken = 0;
  let index = 0;

  const strength = stats.totalAttributes.strength;
  const endurance = stats.totalAttributes.endurance;
  const agility = stats.totalAttributes.agility;
  const petStrength = Math.max(1, Math.round(strength * PET_ATTACK_RATIO));
  let petBlows = 0;
  let petFighting =
    pet !== null && pet !== undefined && pet.energy >= PET_ENERGY_PER_HUNT + PET_ENERGY_PER_BLOW;
  let petSpent = petFighting ? PET_ENERGY_PER_HUNT : 0;
  const petCanBite = () =>
    petFighting && pet !== null && petSpent + PET_ENERGY_PER_BLOW <= pet.energy;

  const foePetStrength = Math.max(1, Math.round(creature.strength * PET_ATTACK_RATIO));
  let foePetFighting =
    foePet !== null &&
    foePet !== undefined &&
    foePet.energy >= PET_ENERGY_PER_HUNT + PET_ENERGY_PER_BLOW;
  let foePetSpent = foePetFighting ? PET_ENERGY_PER_HUNT : 0;
  const foePetCanBite = () =>
    foePetFighting && foePet !== null && foePetSpent + PET_ENERGY_PER_BLOW <= foePet.energy;

  const characterStarts = agility >= creature.agility;
  const hunterExtraChance = extraStrikeChance(agility, creature.agility);
  const creatureExtraChance = extraStrikeChance(creature.agility, agility);

  const characterBlow = (extra = false) => {
    index += 1;
    if (chance(creatureDodge(creature) / 100, random)) {
      rounds.push({
        index,
        author: "character",
        damage: 0,
        critical: false,
        dodged: true,
        characterHealth,
        creatureHealth,
        extraStrike: extra || undefined,
        text: creatureDodgeText(creature.name, characterName, random),
      });
      return;
    }

    const critical = !extra && chance(criticalChance / 100, random);
    const damage = calculateDamage(
      strength,
      creature.endurance,
      critical,
      random,
      criticalMultiplier,
    );
    creatureHealth = Math.max(0, creatureHealth - damage);
    damageDealt += damage;

    const verb = extra
      ? pickOne(CHARACTER_EXTRA_VERBS, random)
      : pickOne(critical ? CHARACTER_CRIT_VERBS : CHARACTER_HIT_VERBS, random);

    rounds.push({
      index,
      author: "character",
      damage,
      critical,
      dodged: false,
      characterHealth,
      creatureHealth,
      extraStrike: extra || undefined,
      text:
        characterName +
        verb +
        creature.name +
        " dealing " +
        damage +
        (critical ? " critical damage." : " damage."),
    });
  };

  const petBlow = () => {
    if (!pet) return;
    index += 1;
    petBlows += 1;
    petSpent += PET_ENERGY_PER_BLOW;

    if (chance(creatureDodge(creature) / 100, random)) {
      rounds.push({
        index,
        author: "pet",
        damage: 0,
        critical: false,
        dodged: true,
        characterHealth,
        creatureHealth,
        text: creature.name + " sidesteps the pounce of " + pet.name + ".",
      });
      return;
    }

    const critical = chance(PET_CRITICAL_CHANCE / 100, random);
    const damage = calculateDamage(petStrength, creature.endurance, critical, random);
    creatureHealth = Math.max(0, creatureHealth - damage);
    damageDealt += damage;

    rounds.push({
      index,
      author: "pet",
      damage,
      critical,
      dodged: false,
      characterHealth,
      creatureHealth,
      text:
        pet.name +
        pickOne(PET_HIT_VERBS, random) +
        creature.name +
        " dealing " +
        damage +
        (critical ? " critical damage." : " damage."),
    });
  };

  const foePetBlow = () => {
    if (!foePet) return;
    index += 1;
    foePetSpent += PET_ENERGY_PER_BLOW;

    if (chance(stats.dodge / 100, random)) {
      rounds.push({
        index,
        author: "creature",
        damage: 0,
        critical: false,
        dodged: true,
        characterHealth,
        creatureHealth,
        text: characterName + " escapes the pounce of " + foePet.name + ".",
      });
      return;
    }

    const critical = chance(PET_CRITICAL_CHANCE / 100, random);
    const damage = calculateDamage(foePetStrength, endurance, critical, random);
    characterHealth = Math.max(0, characterHealth - damage);
    damageTaken += damage;

    rounds.push({
      index,
      author: "creature",
      damage,
      critical,
      dodged: false,
      characterHealth,
      creatureHealth,
      text:
        foePet.name +
        pickOne(PET_HIT_VERBS, random) +
        characterName +
        " dealing " +
        damage +
        (critical ? " critical damage." : " damage."),
    });
  };

  const creatureBlow = (extra = false) => {
    index += 1;

    if (!extra && petFighting && pet && chance(PET_TARGET_CHANCE, random)) {
      petSpent += PET_BITE_ENERGY;
      const down = petSpent >= pet.energy;
      if (down) petFighting = false;

      rounds.push({
        index,
        author: "creature",
        damage: 0,
        critical: false,
        dodged: false,
        characterHealth,
        creatureHealth,
        text: down
          ? creature.name + " hits " + pet.name + " square on, and it leaves the fight out of breath."
          : creature.name + " charges at " + pet.name + ", which yelps and returns to the fight.",
      });
      return;
    }

    if (chance(stats.dodge / 100, random)) {
      rounds.push({
        index,
        author: "creature",
        damage: 0,
        critical: false,
        dodged: true,
        characterHealth,
        creatureHealth,
        extraStrike: extra || undefined,
        text: characterDodgeText(characterName, creature.name, random),
      });
      return;
    }

    const critical = !extra && chance(CREATURE_CRITICAL_CHANCE, random);
    const damage = calculateDamage(creature.strength, endurance, critical, random);
    characterHealth = Math.max(0, characterHealth - damage);
    damageTaken += damage;

    const verb = extra
      ? pickOne(CREATURE_EXTRA_VERBS, random)
      : pickOne(critical ? CREATURE_CRIT_VERBS : CREATURE_HIT_VERBS, random);

    rounds.push({
      index,
      author: "creature",
      damage,
      critical,
      dodged: false,
      characterHealth,
      creatureHealth,
      extraStrike: extra || undefined,
      text:
        creature.name +
        verb +
        characterName +
        " dealing " +
        damage +
        (critical ? " critical damage." : " damage."),
    });
  };

  const maybeHunterExtra = () => {
    if (creatureHealth <= 0) return;
    if (chance(hunterExtraChance / 100, random)) characterBlow(true);
  };

  const maybeCreatureExtra = () => {
    if (characterHealth <= 0 || creatureHealth <= 0) return;
    if (chance(creatureExtraChance / 100, random)) creatureBlow(true);
  };

  let cycles = 0;
  while (characterHealth > 0 && creatureHealth > 0 && cycles < MAX_COMBAT_ROUNDS) {
    cycles += 1;

    if (petFighting && pet && !petCanBite()) {
      petFighting = false;
      index += 1;
      rounds.push({
        index,
        author: "pet",
        damage: 0,
        critical: false,
        dodged: false,
        characterHealth,
        creatureHealth,
        text: pet.name + " falls back panting, no breath left to stay in the fight.",
      });
    }

    if (foePetFighting && foePet && !foePetCanBite()) {
      foePetFighting = false;
      index += 1;
      rounds.push({
        index,
        author: "creature",
        damage: 0,
        critical: false,
        dodged: false,
        characterHealth,
        creatureHealth,
        text: foePet.name + " falls back panting, no breath left to stay in the fight.",
      });
    }

    if (characterStarts) {
      characterBlow();
      maybeHunterExtra();
      if (creatureHealth > 0 && petCanBite()) petBlow();
      if (creatureHealth > 0) {
        creatureBlow();
        maybeCreatureExtra();
      }
      if (characterHealth > 0 && creatureHealth > 0 && foePetCanBite()) foePetBlow();
    } else {
      creatureBlow();
      maybeCreatureExtra();
      if (characterHealth > 0 && foePetCanBite()) foePetBlow();
      if (characterHealth > 0) {
        characterBlow();
        maybeHunterExtra();
      }
      if (characterHealth > 0 && creatureHealth > 0 && petCanBite()) petBlow();
    }
  }

  return {
    victory: creatureHealth <= 0 && characterHealth > 0,
    retreated: characterHealth > 0 && creatureHealth > 0,
    rounds,
    finalHealth: characterHealth,
    damageDealt,
    damageTaken,
    petBlows,
    petSpent,
  };
}
