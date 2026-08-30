import type { Creature } from "../types";

// Cão de Caça (NV. 441 a 450) da área Estrada dos Caçadores.
export const huntingHound: Creature = {
  id: "hunting-hound",
  name: "Cão de Caça",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 441,
  health: 6643,
  strength: 1070,
  endurance: 710,
  agility: 272,
  experience: 3134,
  minBronze: 745,
  maxBronze: 1384,
  drops: [
    { itemId: "chipped-antler", chance: 0.21, minimum: 1, maximum: 2 },
    { itemId: "deer-hide", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
