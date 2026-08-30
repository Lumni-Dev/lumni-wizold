import type { AttributeKey, Attributes } from "./attribute";
import type { Gender } from "./character";
import type { Equipment } from "./item";
import type { PetGender } from "./pet";

export interface HunterPet {
  name: string;
  gender: PetGender;
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
  enhancements: Record<string, number>;
  mining: number;
  pet: HunterPet | null;
  equipment: Equipment;
}

export type RankingKey =
  | AttributeKey
  | "level"
  | "wins"
  | "hunts"
  | "arena"
  | "bronze"
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
    label: "Nível",
    description: "Quem foi mais longe na progressão.",
    value: (hunter) => hunter.level,
  },
  {
    key: "wins",
    label: "Vitórias",
    description: "Combates ganhos desde a primeira noite.",
    value: (hunter) => hunter.wins,
  },
  {
    key: "hunts",
    label: "Caçadas",
    description: "Quantas vezes saiu para caçar, com sorte ou sem.",
    value: (hunter) => hunter.hunts,
  },
  {
    key: "arena",
    label: "Arena",
    description: "Duelos vencidos no fosso, contra outros lobisomens.",
    value: (hunter) => hunter.arena,
  },
  {
    key: "bronze",
    label: "Bronze",
    description: "O que sobrou depois do ferreiro.",
    value: (hunter) => hunter.bronze,
  },
  {
    key: "forge",
    label: "Forja",
    description: "Soma dos níveis de bigorna das sete peças equipadas, não o nível de uma peça só.",
    value: (hunter) => hunter.forge,
  },
  {
    key: "mining",
    label: "Mineração",
    description: "Nível de mineração: quem foi mais fundo na rocha.",
    value: (hunter) => hunter.mining,
  },
  {
    key: "pet",
    label: "Mascote",
    description: "O lobo mais treinado da alcateia: o nível do mascote de cada caçador.",
    value: (hunter) => hunter.pet?.level ?? 0,
  },
  {
    key: "strength",
    label: "Força",
    description: "O golpe mais pesado da matilha.",
    value: (hunter) => hunter.attributes.strength,
  },
  {
    key: "agility",
    label: "Agilidade",
    description: "Quem chega antes e sai ileso.",
    value: (hunter) => hunter.attributes.agility,
  },
  {
    key: "endurance",
    label: "Resistência",
    description: "O corpo que aguenta a noite inteira.",
    value: (hunter) => hunter.attributes.endurance,
  },
  {
    key: "instinct",
    label: "Instinto",
    description: "Quem ouve a presa antes de vê-la.",
    value: (hunter) => hunter.attributes.instinct,
  },
  {
    key: "willpower",
    label: "Vontade",
    description: "Quem manda na fera em vez de obedecer.",
    value: (hunter) => hunter.attributes.willpower,
  },
];

export function findBoard(key: RankingKey): RankingBoard {
  return RANKING_BOARDS.find((board) => board.key === key) ?? RANKING_BOARDS[0];
}
