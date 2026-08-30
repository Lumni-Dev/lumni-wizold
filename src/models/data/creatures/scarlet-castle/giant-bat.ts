import type { Creature } from "../types";

// Morcego Gigante (NV. 811 a 820) da área Castelo Escarlate.
export const giantBat: Creature = {
  id: "giant-bat",
  name: "Morcego Gigante",
  image: "/assets/creatures/scarlet-castle/giant-bat.png",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 811,
  health: 123757,
  strength: 241,
  endurance: 11754,
  agility: 577,
  experience: 5724,
  minBronze: 871,
  maxBronze: 1617,
  drops: [
    { itemId: "bat-wing", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "bat-fang", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
