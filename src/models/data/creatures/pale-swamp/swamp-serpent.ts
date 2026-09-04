import type { Creature } from "../types";

export const swampSerpent: Creature = {
  id: "swamp-serpent",
  name: "Serpente do Pântano",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 331,
  health: 3477,
  strength: 50,
  endurance: 564,
  agility: 224,
  experience: 2364,
  minBronze: 7,
  maxBronze: 13,
  drops: [
    { itemId: "serpent-scale", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
