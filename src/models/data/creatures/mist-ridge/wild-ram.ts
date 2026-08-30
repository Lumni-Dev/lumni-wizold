import type { Creature } from "../types";

// Bode Selvagem (NV. 241 a 250) da área Serra das Brumas.
export const wildRam: Creature = {
  id: "wild-ram",
  name: "Bode Selvagem",
  image: "/assets/creatures/mist-ridge/wild-ram.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 241,
  health: 2242,
  strength: 36,
  endurance: 379,
  agility: 89,
  experience: 1734,
  minBronze: 164,
  maxBronze: 304,
  drops: [
    { itemId: "ram-horn", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
