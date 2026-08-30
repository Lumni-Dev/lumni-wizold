import type { Creature } from "../types";

// Lince do Mato (NV. 91 a 100) da área Campo do Vilarejo.
export const forestLynx: Creature = {
  id: "forest-lynx",
  name: "Lince do Mato",
  image: "/assets/creatures/village-field/forest-lynx.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 91,
  health: 700,
  strength: 22,
  endurance: 114,
  agility: 68,
  experience: 684,
  minBronze: 115,
  maxBronze: 213,
  drops: [
    { itemId: "lynx-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "sharp-fang", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
