import type { Creature } from "../types";

// Puma da Serra (NV. 231 a 240) da área Serra das Brumas.
export const ridgePuma: Creature = {
  id: "ridge-puma",
  name: "Puma da Serra",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 231,
  health: 1814,
  strength: 361,
  endurance: 195,
  agility: 159,
  experience: 1664,
  minBronze: 208,
  maxBronze: 386,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
