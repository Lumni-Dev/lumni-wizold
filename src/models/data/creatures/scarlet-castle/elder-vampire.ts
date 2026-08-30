import type { Creature } from "../types";

// Vampiro Ancião (NV. 861 a 870) da área Castelo Escarlate.
export const elderVampire: Creature = {
  id: "elder-vampire",
  name: "Vampiro Ancião",
  image: "/assets/creatures/scarlet-castle/elder-vampire.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 861,
  health: 257493,
  strength: 382,
  endurance: 31429,
  agility: 568,
  experience: 6074,
  minBronze: 923,
  maxBronze: 1715,
  drops: [
    { itemId: "black-blood", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "empty-fang", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
