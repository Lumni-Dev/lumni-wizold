import type { Creature } from "../types";

export const silverArcher: Creature = {
  id: "silver-archer",
  name: "Arqueiro de Prata",
  image: "/assets/creatures/hunter-road/silver-archer.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 431,
  health: 9790,
  strength: 73,
  endurance: 1195,
  agility: 289,
  experience: 3064,
  minBronze: 251,
  maxBronze: 467,
  drops: [
    { itemId: "silver-arrow", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "silver-charm", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
