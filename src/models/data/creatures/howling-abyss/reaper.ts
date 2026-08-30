import type { Creature } from "../types";

// Ceifador (NV. 771 a 780) da área Abismo Uivante.
export const reaper: Creature = {
  id: "reaper",
  name: "Ceifador",
  image: "/assets/creatures/howling-abyss/reaper.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 771,
  health: 96613,
  strength: 233,
  endurance: 11793,
  agility: 510,
  experience: 5444,
  minBronze: 829,
  maxBronze: 1539,
  drops: [
    { itemId: "reaper-scythe", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "soul-shard", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
