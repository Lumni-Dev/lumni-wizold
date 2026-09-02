import type { Creature } from "../types";

// Falcão Peregrino (NV. 251 a 260) da área Serra das Brumas.
export const peregrineFalcon: Creature = {
  id: "peregrine-falcon",
  name: "Falcão Peregrino",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 251,
  health: 1754,
  strength: 32,
  endurance: 222,
  agility: 185,
  experience: 1804,
  minBronze: 6,
  maxBronze: 10,
  drops: [
    { itemId: "falcon-feather", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "talon", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
