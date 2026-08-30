import type { Creature } from "../types";

// Aberração Ocular (NV. 731 a 740) da área Abismo Uivante.
export const eyeAberration: Creature = {
  id: "eye-aberration",
  name: "Aberração Ocular",
  image: "",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 731,
  health: 8696,
  strength: 1755,
  endurance: 1226,
  agility: 484,
  experience: 5164,
  minBronze: 1161,
  maxBronze: 2156,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
