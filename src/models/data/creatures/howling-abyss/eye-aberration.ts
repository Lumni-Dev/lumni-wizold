import type { Creature } from "../types";

// Aberração Ocular (NV. 731 a 740) da área Abismo Uivante.
export const eyeAberration: Creature = {
  id: "eye-aberration",
  name: "Aberração Ocular",
  image: "/assets/creatures/howling-abyss/eye-aberration.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 731,
  health: 80997,
  strength: 214,
  endurance: 9886,
  agility: 484,
  experience: 5164,
  minBronze: 787,
  maxBronze: 1461,
  drops: [
    { itemId: "aberrant-eye", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "shadow-essence", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
