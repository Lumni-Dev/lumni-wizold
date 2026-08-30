import type { Creature } from "../types";

// Cabra Montesa (NV. 201 a 210) da área Serra das Brumas.
export const mountainGoat: Creature = {
  id: "mountain-goat",
  name: "Cabra Montesa",
  image: "/assets/creatures/mist-ridge/mountain-goat.png",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 201,
  health: 1301,
  strength: 28,
  endurance: 223,
  agility: 128,
  experience: 1454,
  minBronze: 150,
  maxBronze: 278,
  drops: [
    { itemId: "goat-horn", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
