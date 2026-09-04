import type { Creature } from "../types";

export const spectralStag: Creature = {
  id: "spectral-stag",
  name: "Cervo Espectral",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 911,
  health: 302561,
  strength: 390,
  endurance: 38900,
  agility: 554,
  experience: 6424,
  minBronze: 15,
  maxBronze: 27,
  drops: [
    { itemId: "spectral-antler", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "ectoplasm", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
