import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, parse } from "node:path";
import { EMPTY_ART, type ArtManifest } from "../entities/art";
import { ATTRIBUTES } from "../entities/attribute";
import { GENDERS } from "../entities/character";
import { PETS } from "../entities/pet";
import { ITEMS } from "../data/items";
import { STORE_PACKS } from "../data/store-packs";
import { TERRITORIES } from "../data/territories";
import { CREATURES } from "../data/creatures";

const ITEM_ROOT = "inventory";
const HUNT_ROOT = "hunt";
const ATTRIBUTE_ROOT = "attributes";
const TRAINING_ROOT = "training";
const PET_ROOT = "pet";
const GENDER_ROOT = "genders";
const STORE_ROOT = "store";
const CREATURE_ROOT = "creatures";

const IMAGE_EXTENSIONS = new Set([".png", ".webp", ".gif", ".jpg", ".jpeg", ".svg", ".avif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm"]);

const FORMAT_ORDER = [".avif", ".webp", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".mp4", ".webm"];

const ASSETS_ROOT = join(process.cwd(), "public", "assets");
const MANIFEST_PATH = join(process.cwd(), "public", "art-manifest.json");

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

interface RawFile {
  name: string;
  folder: string;
  path: string;
  ext: string;
}

interface FoundFile {
  name: string;
  folder: string;
  url: string;
}

const fingerprints = new Map<string, string>();

function formatRank(ext: string): number {
  const index = FORMAT_ORDER.indexOf(ext.toLowerCase());
  return index === -1 ? FORMAT_ORDER.length : index;
}

async function fingerprint(path: string): Promise<string> {
  const absolute = join(ASSETS_ROOT, path);
  const info = await stat(absolute);
  const key = path + ":" + info.size + ":" + info.mtimeMs;

  const known = fingerprints.get(key);
  if (known) return known;

  const digest = createHash("sha1")
    .update(await readFile(absolute))
    .digest("hex")
    .slice(0, 8);

  fingerprints.set(key, digest);
  return digest;
}

async function resolve(files: RawFile[]): Promise<FoundFile[]> {
  const best = new Map<string, RawFile>();

  for (const file of files) {
    const key = file.path.slice(0, file.path.length - file.ext.length);
    const current = best.get(key);
    if (!current || formatRank(file.ext) < formatRank(current.ext)) best.set(key, file);
  }

  const chosen = [...best.values()].sort((a, b) => a.path.localeCompare(b.path));

  return Promise.all(
    chosen.map(async (file) => ({
      name: file.name,
      folder: file.folder,
      url: "/assets/" + file.path + "?v=" + (await fingerprint(file.path)),
    })),
  );
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

async function walk(
  relative: string,
  extensions: Set<string> = IMAGE_EXTENSIONS,
): Promise<RawFile[]> {
  let entries;
  try {
    entries = await readdir(join(ASSETS_ROOT, relative), { withFileTypes: true });
  } catch {
    return [];
  }

  const found: RawFile[] = [];

  for (const entry of entries) {
    const path = relative + "/" + entry.name;

    if (entry.isDirectory()) {
      found.push(...(await walk(path, extensions)));
      continue;
    }

    const { name, ext } = parse(entry.name);
    if (!extensions.has(ext.toLowerCase())) continue;

    const parts = relative.split("/");
    found.push({
      name,
      folder: parts[parts.length - 1] ?? "",
      path,
      ext,
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

export async function scanArtManifestFromDisk(): Promise<ArtManifest> {
  const [
    itemFiles,
    huntFiles,
    huntVideoFiles,
    attributeFiles,
    trainingFiles,
    creatureFiles,
    petFiles,
    genderFiles,
    packFiles,
  ] = await Promise.all([
    walk(ITEM_ROOT),
    walk(HUNT_ROOT),
    walk(HUNT_ROOT, VIDEO_EXTENSIONS),
    walk(ATTRIBUTE_ROOT),
    walk(TRAINING_ROOT),
    walk(CREATURE_ROOT),
    walk(PET_ROOT),
    walk(GENDER_ROOT),
    walk(STORE_ROOT),
  ]);

  const [items, hunt, huntVideos, attributes, training, creatures, pets, genders, packs] =
    await Promise.all([
      resolve(itemFiles),
      resolve(huntFiles),
      resolve(huntVideoFiles),
      resolve(attributeFiles),
      resolve(trainingFiles),
      resolve(creatureFiles),
      resolve(petFiles),
      resolve(genderFiles),
      resolve(packFiles),
    ]);

  return {
    items: collectItems(items),
    attributes: collectAttributes(attributes),
    training: collectAttributes(training),
    territories: collectTerritories(hunt),
    territoryVideos: collectTerritories(huntVideos),
    creatures: collectCreatures(creatures),
    pets: collectPets(pets),
    genders: collectGenders(genders),
    packs: collectPacks(packs),
  };
}

export async function readArtManifest(): Promise<ArtManifest> {
  if (process.env.NODE_ENV !== "production") {
    return scanArtManifestFromDisk();
  }

  const raw = await readFile(MANIFEST_PATH, "utf8");
  return { ...EMPTY_ART, ...(JSON.parse(raw) as Partial<ArtManifest>) };
}
