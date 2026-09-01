import type { EquipmentSet } from "@/models/entities/item";

/**
 * Full-set price at the band opening, in hunts of that band's purse.
 * Tier ratios follow Tibia body-armor NPC values (plate → knight → crown → golden → MPA),
 * softened for a browser ladder: ~400 hunts at the door, ~9000 at the last band.
 */
export const SET_HUNT_COST: Record<EquipmentSet, number> = {
  bronze: 400,
  silver: 1000,
  gold: 2200,
  diamond: 4000,
  lunar: 9000,
};
