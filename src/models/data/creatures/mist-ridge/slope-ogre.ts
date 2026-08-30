import type { Creature } from "../types";

// Ogro da Encosta (NV. 281 a 290) da área Serra das Brumas.
export const slopeOgre: Creature = {
  id: "slope-ogre",
  name: "Ogro da Encosta",
  image: "",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 281,
  health: 1650,
  strength: 258,
  endurance: 215,
  agility: 103,
  experience: 2014,
  minBronze: 225,
  maxBronze: 418,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
