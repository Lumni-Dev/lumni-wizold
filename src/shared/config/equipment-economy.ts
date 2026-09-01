import type { EquipmentSet } from "@/models/entities/item";

/** Full-set price at the band opening, in hunts of that band's purse. */
export const SET_HUNT_COST: Record<EquipmentSet, number> = {
  bronze: 140,
  silver: 420,
  gold: 520,
  diamond: 620,
  lunar: 760,
};
