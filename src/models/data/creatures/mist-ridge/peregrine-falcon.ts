import type { Creature } from "../types";

// Falcão Peregrino (NV. 251 a 260) da área Serra das Brumas.
export const peregrineFalcon: Creature = {
  id: "peregrine-falcon",
  name: "Falcão Peregrino",
  image: "/assets/creatures/mist-ridge/peregrine-falcon.png",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 251,
  health: 1075,
  strength: 197,
  endurance: 124,
  agility: 185,
  experience: 1804,
  minBronze: 215,
  maxBronze: 399,
  drops: [
    { itemId: "falcon-feather", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "talon", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
