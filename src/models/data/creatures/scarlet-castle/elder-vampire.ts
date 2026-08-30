import type { Creature } from "../types";

// Vampiro Ancião (NV. 861 a 870) da área Castelo Escarlate.
export const elderVampire: Creature = {
  id: "elder-vampire",
  name: "Vampiro Ancião",
  image: "",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 861,
  health: 18657,
  strength: 3706,
  endurance: 2632,
  agility: 568,
  experience: 6074,
  minBronze: 2190,
  maxBronze: 4067,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
