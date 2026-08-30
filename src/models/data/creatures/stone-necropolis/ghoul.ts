import type { Creature } from "../types";

// Carniçal (NV. 631 a 640) da área Necrópole de Pedra.
export const ghoul: Creature = {
  id: "ghoul",
  name: "Carniçal",
  image: "/assets/creatures/stone-necropolis/ghoul.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 631,
  health: 7800,
  strength: 1566,
  endurance: 1099,
  agility: 419,
  experience: 4464,
  minBronze: 1126,
  maxBronze: 2092,
  drops: [
    { itemId: "ghoul-claw", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "rotten-flesh", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
