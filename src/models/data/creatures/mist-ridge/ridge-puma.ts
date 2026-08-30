import type { Creature } from "../types";

// Puma da Serra (NV. 231 a 240) da área Serra das Brumas.
export const ridgePuma: Creature = {
  id: "ridge-puma",
  name: "Puma da Serra",
  image: "/assets/creatures/mist-ridge/ridge-puma.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 231,
  health: 1977,
  strength: 37,
  endurance: 321,
  agility: 159,
  experience: 1664,
  minBronze: 262,
  maxBronze: 486,
  drops: [
    { itemId: "puma-pelt", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "puma-fang", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
