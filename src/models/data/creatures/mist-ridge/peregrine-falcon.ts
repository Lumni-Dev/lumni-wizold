import type { Creature } from "../types";

// Falcão Peregrino (NV. 251 a 260) da área Serra das Brumas.
export const peregrineFalcon: Creature = {
  id: "peregrine-falcon",
  name: "Falcão Peregrino",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 251,
  health: 1402,
  strength: 247,
  endurance: 124,
  agility: 185,
  experience: 1804,
  minBronze: 215,
  maxBronze: 399,
  drops: [
    { itemId: "soft-fur", chance: 0.225, minimum: 1, maximum: 2 },
    { itemId: "lucky-foot", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
