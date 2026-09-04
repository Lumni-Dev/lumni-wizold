import type { Creature } from "../types";

export const bloodyBride: Creature = {
  id: "bloody-bride",
  name: "Noiva Sangrenta",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 871,
  health: 276743,
  strength: 396,
  endurance: 33779,
  agility: 575,
  experience: 6144,
  minBronze: 15,
  maxBronze: 27,
  drops: [
    { itemId: "bride-veil", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "pale-blood", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
