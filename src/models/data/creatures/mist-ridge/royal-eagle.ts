import type { Creature } from "../types";

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
  minBronze: 128,
  maxBronze: 238,
  drops: [
    { itemId: "eagle-feather", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "eagle-talon", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
