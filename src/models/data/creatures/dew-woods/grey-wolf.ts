import type { Creature } from "../types";

// Lobo Cinzento (NV. 121 a 130) da área Mata do Orvalho.
export const greyWolf: Creature = {
  id: "grey-wolf",
  name: "Lobo Cinzento",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 121,
  health: 317,
  strength: 57,
  endurance: 33,
  agility: 80,
  experience: 894,
  minBronze: 49,
  maxBronze: 90,
  drops: [
    { itemId: "chipped-antler", chance: 0.21, minimum: 1, maximum: 2 },
    { itemId: "deer-hide", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
