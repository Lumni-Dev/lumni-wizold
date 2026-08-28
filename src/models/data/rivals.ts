import {
  BASE_ATTRIBUTE_VALUE,
  MAX_ATTRIBUTE_VALUE,
  MAX_CHARACTER_LEVEL,
  MAX_ENHANCEMENT,
} from "@/shared/constants/game";
import { MINING_MAX_LEVEL } from "../entities/mining";
import { intBetween, pickOne, seededRandom, spread } from "@/shared/utils/random";
import { EQUIPMENT_SETS, pieceId } from "./equipment-sets";
import type { Gender } from "../entities/character";
import { emptyEquipment, EQUIPMENT_SLOTS, type Equipment } from "../entities/item";
import type { Hunter } from "../entities/ranking";

const ROSTER_SIZE = 120;
const SEED = 20_260_824;

const NAMES: readonly { name: string; gender: Gender }[] = [
  { name: "Ada", gender: "female" },
  { name: "Bento", gender: "male" },
  { name: "Caim", gender: "male" },
  { name: "Dalva", gender: "female" },
  { name: "Elias", gender: "male" },
  { name: "Fenrir", gender: "male" },
  { name: "Gaia", gender: "female" },
  { name: "Heitor", gender: "male" },
  { name: "Íris", gender: "female" },
  { name: "Jonas", gender: "male" },
  { name: "Kira", gender: "female" },
  { name: "Lucian", gender: "male" },
  { name: "Malva", gender: "female" },
  { name: "Nero", gender: "male" },
  { name: "Olga", gender: "female" },
  { name: "Pedro", gender: "male" },
  { name: "Quéren", gender: "female" },
  { name: "Rurik", gender: "male" },
  { name: "Sara", gender: "female" },
  { name: "Tobias", gender: "male" },
  { name: "Ulric", gender: "male" },
  { name: "Vera", gender: "female" },
  { name: "Wanda", gender: "female" },
  { name: "Yara", gender: "female" },
  { name: "Zoé", gender: "female" },
  { name: "Amaro", gender: "male" },
  { name: "Brisa", gender: "female" },
  { name: "Corvo", gender: "male" },
  { name: "Dagny", gender: "female" },
  { name: "Enzo", gender: "male" },
  { name: "Freya", gender: "female" },
  { name: "Gero", gender: "male" },
];

const WOLF_NAMES = [
  "Brasa",
  "Cinza",
  "Fumo",
  "Bruma",
  "Presa",
  "Lasca",
  "Piche",
  "Neve",
  "Carvão",
  "Vento",
  "Sombra",
  "Garoa",
  "Estopim",
  "Trovão",
  "Musgo",
  "Faísca",
];

const EPITHETS = [
  "da Serra",
  "do Orvalho",
  "de Pedra",
  "da Lua Nova",
  "sem Sombra",
  "do Vilarejo",
  "da Bruma",
  "de Ferro",
  "do Uivo",
  "da Clareira",
  "sem Coleira",
  "da Estrada",
  "do Sangue Frio",
  "da Lua Cheia",
  "da Presa Longa",
];

function levelOf(random: () => number): number {
  const curved = Math.pow(random(), 2.2);
  return Math.max(1, Math.min(MAX_CHARACTER_LEVEL, Math.round(curved * MAX_CHARACTER_LEVEL)));
}

function attributeOf(level: number, random: () => number): number {
  const trained = BASE_ATTRIBUTE_VALUE + level * 0.62 * spread(0.35, random);
  return Math.max(BASE_ATTRIBUTE_VALUE, Math.min(MAX_ATTRIBUTE_VALUE, Math.round(trained)));
}

function gearOf(level: number, gender: Gender, random: () => number): Equipment {
  const affordable = EQUIPMENT_SETS.filter((definition) => definition.minLevel <= level);
  if (affordable.length === 0) return emptyEquipment();

  const set = affordable[Math.max(0, affordable.length - 2)];
  const complete = Math.min(0.95, 0.45 + level / 1200);
  const equipment = emptyEquipment();

  for (const slot of EQUIPMENT_SLOTS) {
    if (random() < complete) equipment[slot] = pieceId(set.key, slot, gender);
  }

  return equipment;
}

function forgeOf(
  equipment: Equipment,
  level: number,
  random: () => number,
): Record<string, number> {
  const worn = EQUIPMENT_SLOTS.map((slot) => equipment[slot]).filter((itemId): itemId is string =>
    Boolean(itemId),
  );
  if (worn.length === 0) return {};

  const enhancements: Record<string, number> = {};
  for (const itemId of worn) {
    const forged = Math.round((level / 6) * spread(0.8, random));
    if (forged > 0) enhancements[itemId] = Math.min(MAX_ENHANCEMENT, forged);
  }

  return enhancements;
}

function buildRivals(): Hunter[] {
  const random = seededRandom(SEED);
  const hunters: Hunter[] = [];
  const taken = new Set<string>();

  for (let index = 0; index < ROSTER_SIZE; index += 1) {
    let first = pickOne(NAMES, random);
    let name = first.name + " " + pickOne(EPITHETS, random);
    while (taken.has(name)) {
      first = pickOne(NAMES, random);
      name = first.name + " " + pickOne(EPITHETS, random);
    }
    taken.add(name);

    const level = levelOf(random);
    const hunts =
      Math.round(level * intBetween(3, 9, random) * spread(0.2, random)) +
      intBetween(0, 40, random);
    const wins = Math.round(hunts * (0.6 + random() * 0.35));
    const arenaTaste = 0.05 + ((index * 37) % 23) / 100;
    const equipment = gearOf(level, first.gender, random);
    const enhancements = forgeOf(equipment, level, random);

    hunters.push({
      id: "rival-" + index,
      name,
      gender: first.gender,
      level,
      attributes: {
        strength: attributeOf(level, random),
        agility: attributeOf(level, random),
        endurance: attributeOf(level, random),
        instinct: attributeOf(level, random),
        willpower: attributeOf(level, random),
      },
      hunts,
      wins,
      losses: hunts - wins,
      arena: Math.round(wins * arenaTaste),
      bronze: Math.round(level * intBetween(40, 900, random) * spread(0.3, random)),
      equipment,
      mining: Math.max(
        1,
        Math.min(MINING_MAX_LEVEL, Math.round((level / 12) * spread(0.3, random))),
      ),
      enhancements,
      forge: Object.values(enhancements).reduce((total, value) => total + value, 0),
      pet:
        random() < 0.55
          ? {
              name: pickOne(WOLF_NAMES, random),
              gender: random() < 0.5 ? ("male" as const) : ("female" as const),
            }
          : null,
    });
  }

  return hunters;
}

export const RIVALS: readonly Hunter[] = buildRivals();

const RIVAL_INDEX = new Map<string, Hunter>(RIVALS.map((rival) => [rival.id, rival]));

export function findRival(id: string): Hunter | undefined {
  return RIVAL_INDEX.get(id);
}
