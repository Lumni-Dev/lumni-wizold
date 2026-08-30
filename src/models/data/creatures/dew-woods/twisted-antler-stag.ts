import type { Creature } from "../types";

// Cervo de Chifre Torto (NV. 171 a 180) da área Mata do Orvalho.
export const twistedAntlerStag: Creature = {
  id: "twisted-antler-stag",
  name: "Cervo de Chifre Torto",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 171,
  health: 429,
  strength: 79,
  endurance: 45,
  agility: 110,
  experience: 1244,
  minBronze: 66,
  maxBronze: 123,
  drops: [
    { itemId: "chipped-antler", chance: 0.21, minimum: 1, maximum: 2 },
    { itemId: "deer-hide", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
