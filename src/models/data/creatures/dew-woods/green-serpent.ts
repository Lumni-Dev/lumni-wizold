import type { Creature } from "../types";

// Serpente Verde (NV. 141 a 150) da área Mata do Orvalho.
export const greenSerpent: Creature = {
  id: "green-serpent",
  name: "Serpente Verde",
  image: "/assets/creatures/dew-woods/green-serpent.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 141,
  health: 983,
  strength: 26,
  endurance: 160,
  agility: 100,
  experience: 1034,
  minBronze: 67,
  maxBronze: 124,
  drops: [
    { itemId: "serpent-scale", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
