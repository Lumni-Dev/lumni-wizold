import type { Creature } from "../types";

// Naga do Charco (NV. 371 a 380) da área Pântano Pálido.
export const marshNaga: Creature = {
  id: "marsh-naga",
  name: "Naga do Charco",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 371,
  health: 2181,
  strength: 446,
  endurance: 234,
  agility: 250,
  experience: 2644,
  minBronze: 256,
  maxBronze: 476,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
