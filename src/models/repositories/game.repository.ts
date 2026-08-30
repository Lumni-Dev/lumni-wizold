import { fillAutomation } from "../entities/automation";
import {
  BASE_ATTRIBUTE_VALUE,
  BASE_VITAL,
  LOG_LIMIT,
  MAX_CHARACTER_LEVEL,
  MAX_ENHANCEMENT,
  PET_MAX_LEVEL,
  STORAGE_KEY,
  STATE_VERSION,
} from "@/shared/constants/game";
import { clamp } from "@/shared/utils/format";
import { generateId } from "@/shared/utils/id";
import type { Attributes } from "../entities/attribute";
import type { Character } from "../entities/character";
import { initialWallet, type BazaarListing } from "../entities/bazaar";
import { emptyEquipment } from "../entities/item";
import { initialMining, MINING_MAX_LEVEL } from "../entities/mining";
import { initialState, type GameState } from "../entities/game-state";
import type { LogEntry } from "../entities/log-entry";
import type { PackMate } from "../entities/pack";
import type { Pet } from "../entities/pet";
import { findItem, itemIdFor } from "../data/items";
import { petLevelOf, petMaxEnergy } from "../rules/pet";
function available(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}
function isValid(data: unknown): data is Partial<GameState> {
  if (typeof data !== "object" || data === null) return false;
  const state = data as Partial<GameState>;
  return (
    typeof state.version === "number" &&
    state.version <= STATE_VERSION &&
    Array.isArray(state.inventory) &&
    Array.isArray(state.log) &&
    typeof state.equipment === "object" &&
    state.equipment !== null
  );
}
function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function finiteInt(value: unknown, fallback: number): number {
  return Math.round(finiteNumber(value, fallback));
}
function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}
function stamp(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
function fillAttributes(shape: Partial<Attributes> | undefined, fallback: number): Attributes {
  return {
    strength: finiteInt(shape?.strength, fallback),
    agility: finiteInt(shape?.agility, fallback),
    endurance: finiteInt(shape?.endurance, fallback),
    instinct: finiteInt(shape?.instinct, fallback),
    willpower: finiteInt(shape?.willpower, fallback),
  };
}
function normalizeCharacter(character: Character): Character {
  const { silver } = character as Character & {
    silver?: number;
  };
  return {
    id: text(character.id, generateId("chr")),
    name: text(character.name, "Errante"),
    gender: character.gender === "female" ? "female" : "male",
    form: character.form === "werewolf" ? "werewolf" : "human",
    level: clamp(finiteInt(character.level, 1), 1, MAX_CHARACTER_LEVEL),
    experience: Math.max(0, finiteInt(character.experience, 0)),
    health: Math.max(0, finiteInt(character.health, BASE_VITAL)),
    rage: Math.max(0, finiteInt(character.rage, 0)),
    bronze: Math.max(0, finiteInt(character.bronze ?? silver, 0)),
    attributes: fillAttributes(character.attributes, BASE_ATTRIBUTE_VALUE),
    trainingProgress: fillAttributes(character.trainingProgress, 0),
    hunts: Math.max(0, finiteInt(character.hunts, 0)),
    wins: Math.max(0, finiteInt(character.wins, 0)),
    losses: Math.max(0, finiteInt(character.losses, 0)),
    arenaWins: Math.max(0, finiteInt(character.arenaWins, 0)),
    arenaLosses: Math.max(0, finiteInt(character.arenaLosses, 0)),
    createdAt: text(character.createdAt, new Date().toISOString()),
    renamedAt: stamp(character.renamedAt),
    transformedAt: stamp(character.transformedAt),
  };
}
function normalizePet(pet: Pet): Pet {
  const level =
    typeof pet.level === "number" && Number.isFinite(pet.level)
      ? clamp(Math.round(pet.level), 1, PET_MAX_LEVEL)
      : undefined;
  const normalized: Pet = {
    id: text(pet.id, generateId("pet")),
    name: text(pet.name, "Lobo"),
    gender: pet.gender === "female" ? "female" : "male",
    energy: 0,
    active: pet.active !== false,
    level,
    trainingProgress: Math.max(0, finiteInt(pet.trainingProgress, 0)),
    adoptedAt: text(pet.adoptedAt, new Date().toISOString()),
  };
  normalized.energy = clamp(finiteInt(pet.energy, 0), 0, petMaxEnergy(petLevelOf(normalized)));
  return normalized;
}
function normalizeInventory(inventory: GameState["inventory"]): GameState["inventory"] {
  return inventory
    .filter(
      (
        slot,
      ): slot is {
        itemId: string;
        quantity: number;
      } => Boolean(slot) && typeof slot.itemId === "string",
    )
    .map((slot) => ({ itemId: slot.itemId, quantity: finiteInt(slot.quantity, 0) }))
    .filter((slot) => slot.quantity > 0);
}
function normalizeListings(listings: BazaarListing[]): BazaarListing[] {
  return listings
    .filter(
      (listing): listing is BazaarListing =>
        Boolean(listing) && typeof listing.itemId === "string" && typeof listing.id === "string",
    )
    .map((listing) => ({
      id: listing.id,
      sellerId: text(listing.sellerId, "chr"),
      sellerName: text(listing.sellerName, "Errante"),
      itemId: listing.itemId,
      enhancement: Math.max(0, finiteInt(listing.enhancement, 0)),
      quantity: finiteInt(listing.quantity, 0),
      priceCents: finiteInt(listing.priceCents, 0),
      announcedAt: stamp(listing.announcedAt),
    }))
    .filter((listing) => listing.quantity > 0 && listing.priceCents > 0);
}
function normalizeRecord<T>(
  record: Record<string, T> | undefined,
  keep: (value: unknown) => T | null,
): Record<string, T> {
  const clean: Record<string, T> = {};
  for (const [key, value] of Object.entries(record ?? {})) {
    const kept = keep(value);
    if (kept !== null) clean[key] = kept;
  }
  return clean;
}
const LOG_KINDS: readonly string[] = [
  "system",
  "character",
  "training",
  "hunt",
  "arena",
  "market",
  "inventory",
];
function normalizeLog(log: LogEntry[]): LogEntry[] {
  return log
    .filter(
      (entry): entry is LogEntry =>
        Boolean(entry) && typeof entry.message === "string" && typeof entry.date === "string",
    )
    .map((entry) => ({
      id: text(entry.id, generateId("log")),
      kind: LOG_KINDS.includes(entry.kind) ? entry.kind : "system",
      message: entry.message,
      date: entry.date,
    }))
    .slice(0, LOG_LIMIT);
}
function normalizePack(pack: PackMate[]): PackMate[] {
  return pack.filter(
    (mate): mate is PackMate =>
      Boolean(mate) && typeof mate.id === "string" && typeof mate.name === "string",
  );
}
function migrateLineage(state: GameState): GameState {
  const lineage = state.character?.gender;
  if (!lineage) return state;
  const moved = (id: string) => itemIdFor(id, lineage);
  return {
    ...state,
    inventory: state.inventory.map((slot) => ({ ...slot, itemId: moved(slot.itemId) })),
    equipment: Object.fromEntries(
      Object.entries(state.equipment).map(([slot, id]) => [slot, id ? moved(id) : id]),
    ) as GameState["equipment"],
    enhancements: Object.fromEntries(
      Object.entries(state.enhancements).map(([id, level]) => [moved(id), level]),
    ),
    bazaarListings: state.bazaarListings.map((listing) => ({
      ...listing,
      itemId: moved(listing.itemId),
    })),
  };
}
function pruneUnknown(state: GameState): GameState {
  return {
    ...state,
    inventory: state.inventory.filter((slot) => Boolean(findItem(slot.itemId))),
    equipment: Object.fromEntries(
      Object.entries(state.equipment).map(([slot, id]) => [slot, id && findItem(id) ? id : null]),
    ) as GameState["equipment"],
    enhancements: Object.fromEntries(
      Object.entries(state.enhancements).filter(([id]) => Boolean(findItem(id))),
    ),
    bazaarListings: state.bazaarListings.filter((listing) => Boolean(findItem(listing.itemId))),
  };
}
function normalize(data: Partial<GameState>): GameState {
  const base = initialState();
  const mining = data.mining as Partial<GameState["mining"]> | undefined;
  const state: GameState = {
    ...base,
    ...data,
    version: STATE_VERSION,
    equipment: { ...emptyEquipment(), ...data.equipment },
    mining:
      typeof mining?.level === "number"
        ? {
            level: clamp(finiteInt(mining.level, 1), 1, MINING_MAX_LEVEL),
            progress: Math.max(0, finiteInt(mining.progress, 0)),
            windowStart: typeof mining.windowStart === "string" ? mining.windowStart : undefined,
            spentMs: Math.max(0, finiteInt(mining.spentMs, 0)),
          }
        : initialMining(),
    enhancements: normalizeRecord(data.enhancements, (value) => {
      const level = finiteInt(value, 0);
      return level >= 1 ? Math.min(level, MAX_ENHANCEMENT) : null;
    }),
    bazaarListings: Array.isArray(data.bazaarListings)
      ? normalizeListings(data.bazaarListings)
      : [],
    bazaarPurchases: normalizeRecord(data.bazaarPurchases, (value) => {
      const bought = finiteInt(value, 0);
      return bought >= 1 ? bought : null;
    }),
    bazaarFinds: Array.isArray(data.bazaarFinds)
      ? [...new Set(data.bazaarFinds.filter((id): id is string => typeof id === "string"))]
      : [],
    arenaDuels: normalizeRecord(data.arenaDuels, (value) =>
      typeof value === "string" ? value : null,
    ),
    pack: Array.isArray(data.pack) ? normalizePack(data.pack) : [],
    automation: fillAutomation(data.automation),
    wallet: { cents: Math.max(0, finiteInt(data.wallet?.cents, initialWallet().cents)) },
    inventory: normalizeInventory(Array.isArray(data.inventory) ? data.inventory : []),
    log: Array.isArray(data.log) ? normalizeLog(data.log) : [],
    pet: data.pet ? normalizePet(data.pet) : null,
  };
  const migrated = state.character
    ? migrateLineage({ ...state, character: normalizeCharacter(state.character) })
    : state;
  return pruneUnknown(migrated);
}
const RESCUE_KEY = STORAGE_KEY + ":rescue";
function rescue(raw: string): void {
  try {
    window.localStorage.setItem(RESCUE_KEY, raw);
  } catch {}
}
export const gameRepository = {
  load(): GameState {
    if (!available()) return initialState();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return initialState();
      let data: unknown;
      try {
        data = JSON.parse(raw);
      } catch {
        rescue(raw);
        return initialState();
      }
      if (!isValid(data)) {
        rescue(raw);
        return initialState();
      }
      return normalize(data);
    } catch {
      return initialState();
    }
  },
  save(state: GameState): void {
    if (!available()) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  },
  clear(): void {
    if (!available()) return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  },
};
