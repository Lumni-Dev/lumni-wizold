import { STATE_VERSION } from "@/shared/constants/game";
import { noAutomation, type Automation } from "./automation";
import { emptyEquipment, type Equipment, type InventorySlot } from "./item";
import type { Character } from "./character";
import { initialWallet, type BazaarListing, type Wallet } from "./bazaar";
import { initialMining, type MiningState } from "./mining";
import type { PackMate } from "./pack";
import type { Pet } from "./pet";
import type { LogEntry } from "./log-entry";

export interface GameState {
  version: number;
  character: Character | null;
  pet: Pet | null;
  mining: MiningState;
  enhancements: Record<string, number>;
  bazaarListings: BazaarListing[];
  bazaarPurchases: Record<string, number>;
  bazaarFinds: string[];
  arenaDuels: Record<string, string>;
  pack: PackMate[];
  wallet: Wallet;
  automation: Automation;
  inventory: InventorySlot[];
  equipment: Equipment;
  log: LogEntry[];
}

export function initialState(): GameState {
  return {
    version: STATE_VERSION,
    character: null,
    pet: null,
    mining: initialMining(),
    enhancements: {},
    bazaarListings: [],
    bazaarPurchases: {},
    bazaarFinds: [],
    arenaDuels: {},
    pack: [],
    wallet: initialWallet(),
    automation: noAutomation(),
    inventory: [],
    equipment: emptyEquipment(),
    log: [],
  };
}
