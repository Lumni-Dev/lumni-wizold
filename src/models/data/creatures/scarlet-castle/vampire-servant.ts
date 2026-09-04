import type { Creature } from "../types";

export const vampireServant: Creature = {
  id: "vampire-servant",
  name: "Servo Vampiro",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 801,
  health: 141242,
  strength: 282,
  endurance: 17240,
  agility: 529,
  experience: 5654,
  minBronze: 13,
  maxBronze: 25,
  drops: [
    { itemId: "empty-fang", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "pale-blood", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
