import type { Creature } from "../types";

// Espectro (NV. 621 a 630) da área Necrópole de Pedra.
export const specter: Creature = {
  id: "specter",
  name: "Espectro",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 621,
  health: 10145,
  strength: 1951,
  endurance: 1096,
  agility: 412,
  experience: 4394,
  minBronze: 1123,
  maxBronze: 2085,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
