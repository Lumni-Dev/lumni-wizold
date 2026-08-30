import type { Creature } from "../types";

// Espectro (NV. 621 a 630) da área Necrópole de Pedra.
export const specter: Creature = {
  id: "specter",
  name: "Espectro",
  image: "/assets/creatures/stone-necropolis/specter.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 621,
  health: 38100,
  strength: 146,
  endurance: 4650,
  agility: 412,
  experience: 4394,
  minBronze: 2185,
  maxBronze: 4059,
  drops: [
    { itemId: "ectoplasm", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "grave-dirt", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
