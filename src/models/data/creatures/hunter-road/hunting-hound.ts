import type { Creature } from "../types";

// Cão de Caça (NV. 441 a 450) da área Estrada dos Caçadores.
export const huntingHound: Creature = {
  id: "hunting-hound",
  name: "Cão de Caça",
  image: "/assets/creatures/hunter-road/hunting-hound.png",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 441,
  health: 5093,
  strength: 856,
  endurance: 710,
  agility: 272,
  experience: 3134,
  minBronze: 745,
  maxBronze: 1384,
  drops: [
    { itemId: "canine-pelt", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "sharp-fang", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
