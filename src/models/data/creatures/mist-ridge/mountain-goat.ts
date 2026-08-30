import type { Creature } from "../types";

// Cabra Montesa (NV. 201 a 210) da área Serra das Brumas.
export const mountainGoat: Creature = {
  id: "mountain-goat",
  name: "Cabra Montesa",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 201,
  health: 511,
  strength: 94,
  endurance: 53,
  agility: 128,
  experience: 1454,
  minBronze: 76,
  maxBronze: 142,
  drops: [
    { itemId: "chipped-antler", chance: 0.21, minimum: 1, maximum: 2 },
    { itemId: "deer-hide", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
