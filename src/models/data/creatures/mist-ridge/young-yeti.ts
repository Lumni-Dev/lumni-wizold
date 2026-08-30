import type { Creature } from "../types";

// Iéti Jovem (NV. 261 a 270) da área Serra das Brumas.
export const youngYeti: Creature = {
  id: "young-yeti",
  name: "Iéti Jovem",
  image: "",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 261,
  health: 1606,
  strength: 250,
  endurance: 209,
  agility: 96,
  experience: 1874,
  minBronze: 218,
  maxBronze: 405,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
