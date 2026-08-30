import type { Creature } from "../types";

// Cervo Espectral (NV. 911 a 920) da área Clareira Branca.
export const spectralStag: Creature = {
  id: "spectral-stag",
  name: "Cervo Espectral",
  image: "/assets/creatures/white-clearing/spectral-stag.png",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 911,
  health: 15245,
  strength: 2535,
  endurance: 2129,
  agility: 554,
  experience: 6424,
  minBronze: 2208,
  maxBronze: 4100,
  drops: [
    { itemId: "spectral-antler", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "ectoplasm", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
