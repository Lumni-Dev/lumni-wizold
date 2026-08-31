import { noAutomation } from "@/models/entities/automation";
import { BASE_ATTRIBUTE_VALUE, STARTING_BRONZE, STATE_VERSION } from "@/shared/constants/game";
import { generateId } from "@/shared/utils/id";
import { addAttributes, type Attributes } from "../entities/attribute";
import { initialWallet } from "../entities/bazaar";
import { initialMining } from "../entities/mining";
import { emptyEquipment, type InventorySlot } from "../entities/item";
import type { GameState } from "../entities/game-state";
import { findGender, type Character, type Gender } from "../entities/character";
import type { LogEntry } from "../entities/log-entry";
import { deriveStats } from "../rules/stats";

const STARTING_ATTRIBUTES: Attributes = {
  strength: BASE_ATTRIBUTE_VALUE,
  agility: BASE_ATTRIBUTE_VALUE,
  endurance: BASE_ATTRIBUTE_VALUE,
  instinct: BASE_ATTRIBUTE_VALUE,
  willpower: BASE_ATTRIBUTE_VALUE,
};

const STARTING_INVENTORY: InventorySlot[] = [
  { itemId: "health-potion-small", quantity: 10, enhancement: 0 },
];

function createCharacter(name: string, gender: Gender): Character {
  const definition = findGender(gender);
  const attributes = addAttributes(STARTING_ATTRIBUTES, definition.bonus);

  const base: Character = {
    id: generateId("chr"),
    name: name.trim(),
    gender,
    level: 1,
    experience: 0,
    health: 0,
    bronze: STARTING_BRONZE,
    attributes,
    trainingProgress: { strength: 0, agility: 0, endurance: 0, instinct: 0, willpower: 0 },
    hunts: 0,
    wins: 0,
    losses: 0,
    arenaWins: 0,
    arenaLosses: 0,
    createdAt: new Date().toISOString(),
  };

  const stats = deriveStats(base, emptyEquipment());
  return { ...base, health: stats.maxHealth };
}

export function createRun(name: string, gender: Gender): GameState {
  const character = createCharacter(name, gender);
  const opening: LogEntry = {
    id: generateId("log"),
    kind: "system",
    message: character.name + " desperta com a marca da lua. A primeira noite começa agora.",
    date: new Date().toISOString(),
  };

  return {
    version: STATE_VERSION,
    character,
    pet: null,
    mining: initialMining(),
    bazaarListings: [],
    bazaarPurchases: {},
    bazaarFinds: [],
    arenaDuels: {},
    pack: [],
    automation: noAutomation(),
    wallet: initialWallet(),
    inventory: STARTING_INVENTORY.map((slot) => ({ ...slot })),
    equipment: emptyEquipment(),
    log: [opening],
  };
}
