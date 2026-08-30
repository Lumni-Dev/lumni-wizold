import type { Creature } from "../types";

// Cervo de Chifre Torto (NV. 171 a 180) da área Mata do Orvalho.
export const twistedAntlerStag: Creature = {
  id: "twisted-antler-stag",
  name: "Cervo de Chifre Torto",
  image: "/assets/creatures/dew-woods/twisted-antler-stag.png",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 171,
  health: 989,
  strength: 24,
  endurance: 169,
  agility: 110,
  experience: 1244,
  minBronze: 106,
  maxBronze: 196,
  drops: [
    { itemId: "twisted-antler", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "deer-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
