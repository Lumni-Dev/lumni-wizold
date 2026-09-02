import type { Creature } from "../types";

// Carniçal (NV. 631 a 640) da área Necrópole de Pedra.
export const ghoul: Creature = {
  id: "ghoul",
  name: "Carniçal",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 631,
  health: 41988,
  strength: 153,
  endurance: 5125,
  agility: 419,
  experience: 4464,
  minBronze: 11,
  maxBronze: 21,
  drops: [
    { itemId: "ghoul-claw", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "rotten-flesh", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
