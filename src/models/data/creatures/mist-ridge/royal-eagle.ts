import type { Creature } from "../types";

// Águia Real (NV. 211 a 220) da área Serra das Brumas.
export const royalEagle: Creature = {
  id: "royal-eagle",
  name: "Águia Real",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 211,
  health: 629,
  strength: 139,
  endurance: 66,
  agility: 146,
  experience: 1524,
  minBronze: 80,
  maxBronze: 149,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
