import type { AttributeKey, Attributes } from "./attribute";
import type { Gender } from "./character";
import type { Equipment } from "./item";

export interface HunterPet {
  name: string;
  level: number;
  energy: number;
  active: boolean;
}

export interface Hunter {
  id: string;
  name: string;
  gender: Gender;
  level: number;
  attributes: Attributes;
  hunts: number;
  wins: number;
  losses: number;
  arena: number;
  arenaLosses: number;
  bronze: number;
  forge: number;
  mining: number;
  pet: HunterPet | null;
  equipment: Equipment;
  npc: boolean;
  vip?: boolean;
  createdAt: string;
}

export type RankingKey =
  | AttributeKey
  | "level"
  | "wins"
  | "hunts"
  | "arena"
  | "forge"
  | "mining"
  | "pet";

export interface RankingBoard {
  key: RankingKey;
  label: string;
  description: string;
  value: (hunter: Hunter) => number;
}

export const RANKING_BOARDS: readonly RankingBoard[] = [
  {
    key: "level",
    label: "Level",
    description: "Who went furthest in the progression.",
    value: (hunter) => hunter.level,
  },
  {
    key: "wins",
    label: "Victories",
    description: "Fights won since the first night.",
    value: (hunter) => hunter.wins,
  },
  {
    key: "hunts",
    label: "Hunts",
    description: "How many times they went out to hunt, with luck or without.",
    value: (hunter) => hunter.hunts,
  },
  {
    key: "arena",
    label: "Arena",
    description: "Duels won in the pit, against other werewolves.",
    value: (hunter) => hunter.arena,
  },
  {
    key: "forge",
    label: "Forge",
    description: "Sum of the anvil levels of the seven equipped pieces, not the level of a single piece.",
    value: (hunter) => hunter.forge,
  },
  {
    key: "mining",
    label: "Mining",
    description: "Mining level: who went deepest into the rock.",
    value: (hunter) => hunter.mining,
  },
  {
    key: "pet",
    label: "Companion",
    description: "The most trained wolf of the pack: each hunter's companion level.",
    value: (hunter) => hunter.pet?.level ?? 0,
  },
  {
    key: "strength",
    label: "Strength",
    description: "The heaviest blow in the pack.",
    value: (hunter) => hunter.attributes.strength,
  },
  {
    key: "agility",
    label: "Agility",
    description: "Who arrives first and leaves unharmed.",
    value: (hunter) => hunter.attributes.agility,
  },
  {
    key: "endurance",
    label: "Endurance",
    description: "The body that endures the whole night.",
    value: (hunter) => hunter.attributes.endurance,
  },
  {
    key: "instinct",
    label: "Instinct",
    description: "Who hears the prey before seeing it.",
    value: (hunter) => hunter.attributes.instinct,
  },
  {
    key: "willpower",
    label: "Willpower",
    description: "Who commands the beast instead of obeying it.",
    value: (hunter) => hunter.attributes.willpower,
  },
];

export function findBoard(key: RankingKey): RankingBoard {
  return RANKING_BOARDS.find((board) => board.key === key) ?? RANKING_BOARDS[0];
}
