import type { Gender } from "@/models/entities/character";

export const VITALS = {
  baseVital: 150,
  healthPerResistance: 0,
  healthPerLevel: {
    male: 8,
    female: 6,
  } satisfies Record<Gender, number>,
};

export function healthPerLevelFor(gender: Gender): number {
  return VITALS.healthPerLevel[gender];
}
