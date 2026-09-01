import { readdir } from "node:fs/promises";
import { join, parse } from "node:path";
import type { ArtManifest } from "../entities/art";
import { ATTRIBUTES } from "../entities/attribute";
import { GENDERS } from "../entities/character";
import { PETS } from "../entities/pet";
import { ITEMS } from "../data/items";
import { STORE_PACKS } from "../data/store-packs";
import { TERRITORIES } from "../data/territories";
import { CREATURES } from "../data/creatures";
import { ART_VERSION } from "@/shared/constants/assets";

const ITEM_ROOT = "inventory";
const HUNT_ROOT = "hunt";
const ATTRIBUTE_ROOT = "attributes";
const TRAINING_ROOT = "training";
const PET_ROOT = "pet";
const GENDER_ROOT = "genders";
const STORE_ROOT = "store";
const CREATURE_ROOT = "creatures";

const IMAGE_EXTENSIONS = new Set([".png", ".webp", ".gif", ".jpg", ".jpeg", ".svg", ".avif"]);

const ASSETS_ROOT = join(process.cwd(), "public", "assets");

const ITEM_IDS = new Set(ITEMS.map((item) => item.id));
const CREATURE_IDS = new Set(CREATURES.map((creature) => creature.id));
const SET_ALIASES: Record<string, string> = {
  bronze: "bronze",
  silver: "silver",
  silvery: "silver",
  gold: "gold",
  golden: "gold",
  diamond: "diamond",
  lunar: "lunar",
  moon: "lunar",
};

const SLOT_ALIASES: Record<string, string> = {
  helmet: "helmet",
  helm: "helmet",
  head: "helmet",
  necklace: "necklace",
  amulet: "necklace",
  pendant: "necklace",
  armor: "armor",
  armour: "armor",
  chest: "armor",
  chestplate: "armor",
  cuirass: "armor",
  pants: "pants",
  legs: "pants",
  greaves: "pants",
  boots: "boots",
  boot: "boots",
  claw: "claw",
  claws: "claw",
  gauntlet: "claw",
  gauntlets: "claw",
  ring: "ring",
};

interface FoundFile {
  name: string;
  folder: string;
  url: string;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function folderSet(folder: string): string | null {
  const key = normalize(folder).replace(/-?set$/, "");
  return SET_ALIASES[key] ?? null;
}

function equipmentIdFrom(name: string, folder: string): string | null {
  const words = normalize(name).split("-");

  const set = words.map((word) => SET_ALIASES[word]).find(Boolean) ?? folderSet(folder);
  const slot = words.map((word) => SLOT_ALIASES[word]).find(Boolean);

  return set && slot ? set + "-" + slot : null;
}

async function walk(relative: string): Promise<FoundFile[]> {
  let entries;
  try {
    entries = await readdir(join(ASSETS_ROOT, relative), { withFileTypes: true });
  } catch {
    return [];
  }

  const found: FoundFile[] = [];

  for (const entry of entries) {
    const path = relative + "/" + entry.name;

    if (entry.isDirectory()) {
      found.push(...(await walk(path)));
      continue;
    }

    const { name, ext } = parse(entry.name);
    if (!IMAGE_EXTENSIONS.has(ext.toLowerCase())) continue;

    const parts = relative.split("/");
    found.push({
      name,
      folder: parts[parts.length - 1] ?? "",
      url: "/assets/" + path + ART_VERSION,
    });
  }

  return found;
}

function collectItems(files: FoundFile[]): Record<string, string> {
  const art: Record<string, string> = {};

  for (const file of files) {
    const direct = normalize(file.name);
    const prefixed = normalize(file.folder).replace(/-?set$/, "") + "-" + direct;

    const id = ITEM_IDS.has(direct)
      ? direct
      : ITEM_IDS.has(prefixed)
        ? prefixed
        : equipmentIdFrom(file.name, file.folder);

    if (id && ITEM_IDS.has(id)) art[id] = file.url;
  }

  return art;
}

function collectAttributes(files: FoundFile[]): Record<string, string> {
  const art: Record<string, string> = {};

  for (const file of files) {
    const name = normalize(file.name);
    const definition = ATTRIBUTES.find(
      (attribute) =>
        attribute.key === name ||
        normalize(attribute.name) === name ||
        normalize(attribute.code) === name,
    );
    if (definition) art[definition.key] = file.url;
  }

  return art;
}

function collectTerritories(files: FoundFile[]): Record<string, string> {
  const art: Record<string, string> = {};

  for (const file of files) {
    const name = normalize(file.name);
    const territory = TERRITORIES.find(
      (entry) =>
        entry.id === name ||
        normalize(entry.name) === name ||
        normalize(entry.name).startsWith(name + "-"),
    );
    if (territory) art[territory.id] = file.url;
  }

  return art;
}

function collectGenders(files: FoundFile[]): Record<string, string> {
  const art: Record<string, string> = {};

  for (const file of files) {
    const words = normalize(file.name).split("-");
    const definition = GENDERS.find(
      (gender) => words.includes(gender.key) || words.includes(normalize(gender.label)),
    );
    if (definition) art[definition.key] = file.url;
  }

  return art;
}

function collectPets(files: FoundFile[]): Record<string, string> {
  const art: Record<string, string> = {};

  for (const file of files) {
    const words = normalize(file.name).split("-");
    const definition = PETS.find(
      (pet) => words.includes(pet.key) || words.includes(normalize(pet.label)),
    );
    if (definition) art[definition.key] = file.url;
  }

  return art;
}

function collectPacks(files: FoundFile[]): Record<string, string> {
  const art: Record<string, string> = {};

  for (const file of files) {
    const name = normalize(file.name);
    const pack = STORE_PACKS.find((entry) => entry.id === name || normalize(entry.name) === name);
    if (pack) art[pack.id] = file.url;
  }

  return art;
}

function collectCreatures(files: FoundFile[]): Record<string, string> {
  const art: Record<string, string> = {};

  for (const file of files) {
    const id = normalize(file.name);
    if (CREATURE_IDS.has(id)) art[id] = file.url;
  }

  return art;
}

export async function readArtManifest(): Promise<ArtManifest> {
  const [
    itemFiles,
    huntFiles,
    attributeFiles,
    trainingFiles,
    creatureFiles,
    petFiles,
    genderFiles,
    packFiles,
  ] = await Promise.all([
    walk(ITEM_ROOT),
    walk(HUNT_ROOT),
    walk(ATTRIBUTE_ROOT),
    walk(TRAINING_ROOT),
    walk(CREATURE_ROOT),
    walk(PET_ROOT),
    walk(GENDER_ROOT),
    walk(STORE_ROOT),
  ]);

  return {
    items: collectItems(itemFiles),
    attributes: collectAttributes(attributeFiles),
    training: collectAttributes(trainingFiles),
    territories: collectTerritories(huntFiles),
    creatures: collectCreatures(creatureFiles),
    pets: collectPets(petFiles),
    genders: collectGenders(genderFiles),
    packs: collectPacks(packFiles),
  };
}
