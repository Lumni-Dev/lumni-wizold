import type { Creature } from "../types";

// Cão do Inferno (NV. 711 a 720) da área Abismo Uivante.
export const hellhound: Creature = {
  id: "hellhound",
  name: "Cão do Inferno",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 711,
  health: 11013,
  strength: 2127,
  endurance: 1190,
  agility: 471,
  experience: 5024,
  minBronze: 1154,
  maxBronze: 2143,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
