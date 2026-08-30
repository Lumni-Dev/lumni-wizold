import type { Creature } from "../types";

// Cervo Espectral (NV. 911 a 920) da área Clareira Branca.
export const spectralStag: Creature = {
  id: "spectral-stag",
  name: "Cervo Espectral",
  image: "",
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
    { itemId: "chipped-antler", chance: 0.21, minimum: 1, maximum: 2 },
    { itemId: "deer-hide", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
