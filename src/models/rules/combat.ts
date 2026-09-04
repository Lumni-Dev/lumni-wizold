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
  if (combat.finalHealth <= 0) return false;
  if (combat.victory) return true;
  const last = combat.rounds[combat.rounds.length - 1];
  return Boolean(last && last.creatureHealth <= 0);
}

export function hunterRetreated(combat: CombatOutcome): boolean {
  return combat.finalHealth > 0 && !hunterWon(combat);
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

const CHARACTER_HIT_VERBS = [" acerta ", " morde ", " crava as garras em ", " golpeia "];
const CHARACTER_CRIT_VERBS = [" rasga ", " despedaça ", " abre "];
const CREATURE_HIT_VERBS = [" atinge ", " acerta ", " crava os dentes em "];
const CREATURE_CRIT_VERBS = [" dilacera ", " rasga "];
const PET_HIT_VERBS = [" morde ", " se lança sobre ", " rasga o flanco de "];

function creatureDodgeText(creatureName: string, characterName: string, random: Random): string {
  return pickOne(
    [
      creatureName + " desvia do golpe de " + characterName + ".",
      creatureName + " escapa por um fio das garras de " + characterName + ".",
      "O bote de " + characterName + " passa raspando por " + creatureName + ".",
    ],
    random,
  );
}

function characterDodgeText(characterName: string, creatureName: string, random: Random): string {
  return pickOne(
    [
      characterName + " escapa do bote de " + creatureName + ".",
      characterName + " rola para longe do ataque de " + creatureName + ".",
      "O golpe de " + creatureName + " corta só o vento.",
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

  const characterStarts = stats.totalAttributes.agility >= creature.agility;

  const characterBlow = () => {
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
        text: creatureDodgeText(creature.name, characterName, random),
      });
      return;
    }

    const critical = chance(criticalChance / 100, random);
    const damage = calculateDamage(
      strength,
      creature.endurance,
      critical,
      random,
      criticalMultiplier,
    );
    creatureHealth = Math.max(0, creatureHealth - damage);
    damageDealt += damage;

    rounds.push({
      index,
      author: "character",
      damage,
      critical,
      dodged: false,
      characterHealth,
      creatureHealth,
      text:
        characterName +
        pickOne(critical ? CHARACTER_CRIT_VERBS : CHARACTER_HIT_VERBS, random) +
        creature.name +
        " causando " +
        damage +
        " de dano" +
        (critical ? " crítico." : "."),
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
        text: creature.name + " se esquiva do bote de " + pet.name + ".",
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
        " causando " +
        damage +
        " de dano" +
        (critical ? " crítico." : "."),
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
        text: characterName + " escapa do bote de " + foePet.name + ".",
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
        " causando " +
        damage +
        " de dano" +
        (critical ? " crítico." : "."),
    });
  };

  const creatureBlow = () => {
    index += 1;

    if (petFighting && pet && chance(PET_TARGET_CHANCE, random)) {
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
          ? creature.name + " acerta " + pet.name + " em cheio, que sai da luta sem fôlego."
          : creature.name + " investe contra " + pet.name + ", que gane e volta ao combate.",
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
        text: characterDodgeText(characterName, creature.name, random),
      });
      return;
    }

    const critical = chance(CREATURE_CRITICAL_CHANCE, random);
    const damage = calculateDamage(creature.strength, endurance, critical, random);
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
        creature.name +
        pickOne(critical ? CREATURE_CRIT_VERBS : CREATURE_HIT_VERBS, random) +
        characterName +
        " causando " +
        damage +
        " de dano" +
        (critical ? " crítico." : "."),
    });
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
        text: pet.name + " recua ofegante, sem fôlego para seguir na luta.",
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
        text: foePet.name + " recua ofegante, sem fôlego para seguir na luta.",
      });
    }

    if (characterStarts) {
      characterBlow();
      if (creatureHealth > 0 && petCanBite()) petBlow();
      if (creatureHealth > 0) creatureBlow();
      if (characterHealth > 0 && creatureHealth > 0 && foePetCanBite()) foePetBlow();
    } else {
      creatureBlow();
      if (characterHealth > 0 && foePetCanBite()) foePetBlow();
      if (characterHealth > 0) characterBlow();
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
