import type { Creature } from "../types";

// Águia Real (NV. 211 a 220) da área Serra das Brumas.
export const royalEagle: Creature = {
  id: "royal-eagle",
  name: "Águia Real",
  image: "/assets/creatures/mist-ridge/royal-eagle.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 211,
  health: 1677,
  strength: 34,
  endurance: 272,
  agility: 146,
  experience: 1524,
  minBronze: 241,
  maxBronze: 447,
  drops: [
    { itemId: "eagle-feather", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "eagle-talon", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
