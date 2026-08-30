import type { Creature } from "../types";

// Servo Vampiro (NV. 801 a 810) da área Castelo Escarlate.
export const vampireServant: Creature = {
  id: "vampire-servant",
  name: "Servo Vampiro",
  image: "",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 801,
  health: 9598,
  strength: 1943,
  endurance: 1353,
  agility: 529,
  experience: 5654,
  minBronze: 1185,
  maxBronze: 2201,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
