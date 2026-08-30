import type { Creature } from "../types";

export const ghoul: Creature = {
  id: "ghoul",
  name: "Carniçal",
  image: "/assets/creatures/stone-necropolis/ghoul.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 631,
  health: 41988,
  strength: 153,
  endurance: 5125,
  agility: 419,
  experience: 4464,
  minBronze: 363,
  maxBronze: 675,
  drops: [
    { itemId: "ghoul-claw", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "rotten-flesh", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
