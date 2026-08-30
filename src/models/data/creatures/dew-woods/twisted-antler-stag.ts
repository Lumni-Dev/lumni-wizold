import type { Creature } from "../types";

// Cervo de Chifre Torto (NV. 171 a 180) da área Mata do Orvalho.
export const twistedAntlerStag: Creature = {
  id: "twisted-antler-stag",
  name: "Cervo de Chifre Torto",
  image: "/assets/creatures/dew-woods/twisted-antler-stag.png",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 171,
  health: 329,
  strength: 63,
  endurance: 45,
  agility: 110,
  experience: 1244,
  minBronze: 66,
  maxBronze: 123,
  drops: [
    { itemId: "twisted-antler", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "deer-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
