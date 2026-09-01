import type { Attributes, AttributeKey } from "./attribute";

export type Gender = "male" | "female";

export interface GenderDefinition {
  key: Gender;
  label: string;
  title: string;
  description: string;
  bonus: Partial<Attributes>;
  bonusLabel: string;
}

export const GENDERS: readonly GenderDefinition[] = [
  {
    key: "male",
    label: "Lumni",
    title: "Herdeiro da Presa",
    description: "Linhagem que responde à lua com músculo e brutalidade direta.",
    bonus: { strength: 14, endurance: 14, willpower: 14 },
    bonusLabel: "+14 Força, +14 Resistência, +14 Vontade",
  },
  {
    key: "female",
    label: "Luna",
    title: "Herdeira da Lua",
    description: "Linhagem que responde à lua com precisão, faro e silêncio.",
    bonus: { agility: 14, instinct: 14, willpower: 14 },
    bonusLabel: "+14 Agilidade, +14 Instinto, +14 Vontade",
  },
] as const;

export interface Character {
  id: string;
  name: string;
  gender: Gender;
  level: number;
  experience: number;
  health: number;
  bronze: number;
  attributes: Attributes;
  trainingProgress: Record<AttributeKey, number>;
  hunts: number;
  wins: number;
  losses: number;
  arenaWins: number;
  arenaLosses: number;
  createdAt: string;
  renamedAt?: string;
  furyUntil?: string;
  vipUntil?: string;
  vipSubscriptionId?: string;
  vipCanceling?: boolean;
}

export function findGender(key: Gender): GenderDefinition {
  return GENDERS.find((gender) => gender.key === key) ?? GENDERS[0];
}
