import type { Creature } from "../types";

// Lobo da Neve (NV. 271 a 280) da área Serra das Brumas.
export const snowWolf: Creature = {
  id: "snow-wolf",
  name: "Lobo da Neve",
  image: "",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 271,
  health: 1361,
  strength: 238,
  endurance: 189,
  agility: 170,
  experience: 1944,
  minBronze: 222,
  maxBronze: 412,
  drops: [
    { itemId: "chipped-antler", chance: 0.21, minimum: 1, maximum: 2 },
    { itemId: "deer-hide", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
