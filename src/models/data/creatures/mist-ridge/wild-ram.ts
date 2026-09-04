import type { Creature } from "../types";

export const wildRam: Creature = {
  id: "wild-ram",
  name: "Bode Selvagem",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 241,
  health: 2242,
  strength: 36,
  endurance: 379,
  agility: 89,
  experience: 1734,
  minBronze: 6,
  maxBronze: 10,
  drops: [
    { itemId: "ram-horn", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
