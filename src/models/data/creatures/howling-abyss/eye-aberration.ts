import type { Creature } from "../types";

export const eyeAberration: Creature = {
  id: "eye-aberration",
  name: "Aberração Ocular",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 731,
  health: 80997,
  strength: 214,
  endurance: 9886,
  agility: 484,
  experience: 5164,
  minBronze: 13,
  maxBronze: 23,
  drops: [
    { itemId: "aberrant-eye", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "shadow-essence", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
