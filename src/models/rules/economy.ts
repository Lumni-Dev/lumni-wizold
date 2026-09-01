import { BALANCE } from "@/shared/constants/tuning/balance";

export function huntPurse(level: number): number {
  return Math.round(BALANCE.bronzeBase + level * BALANCE.bronzePerLevel);
}
