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
    title: "Heir of the Prey",
    description: "A bloodline that answers the moon with muscle and direct brutality.",
    bonus: { strength: 14, endurance: 14, willpower: 14 },
    bonusLabel: "+14 Strength, +14 Endurance, +14 Willpower",
  },
  {
    key: "female",
    label: "Luna",
    title: "Heiress of the Moon",
    description: "A bloodline that answers the moon with precision, scent and silence.",
    bonus: { agility: 14, instinct: 14, willpower: 14 },
    bonusLabel: "+14 Agility, +14 Instinct, +14 Willpower",
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
