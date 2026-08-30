import type { Creature } from "../types";

export const bloodyBride: Creature = {
  id: "bloody-bride",
  name: "Noiva Sangrenta",
  image: "/assets/creatures/scarlet-castle/bloody-bride.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 871,
  health: 276743,
  strength: 396,
  endurance: 33779,
  agility: 575,
  experience: 6144,
  minBronze: 498,
  maxBronze: 924,
  drops: [
    { itemId: "bride-veil", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "pale-blood", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
