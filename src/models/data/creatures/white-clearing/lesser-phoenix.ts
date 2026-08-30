import type { Creature } from "../types";

// Fênix Menor (NV. 921 a 930) da área Clareira Branca.
export const lesserPhoenix: Creature = {
  id: "lesser-phoenix",
  name: "Fênix Menor",
  image: "/assets/creatures/white-clearing/lesser-phoenix.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 921,
  health: 373356,
  strength: 460,
  endurance: 45572,
  agility: 607,
  experience: 6494,
  minBronze: 526,
  maxBronze: 976,
  drops: [
    { itemId: "phoenix-ash", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "phoenix-feather", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
