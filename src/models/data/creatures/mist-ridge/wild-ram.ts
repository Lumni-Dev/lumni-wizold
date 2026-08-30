import type { Creature } from "../types";

// Bode Selvagem (NV. 241 a 250) da área Serra das Brumas.
export const wildRam: Creature = {
  id: "wild-ram",
  name: "Bode Selvagem",
  image: "",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 241,
  health: 1561,
  strength: 242,
  endurance: 203,
  agility: 89,
  experience: 1734,
  minBronze: 211,
  maxBronze: 392,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
