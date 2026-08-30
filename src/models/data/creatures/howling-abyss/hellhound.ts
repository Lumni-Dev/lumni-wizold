import type { Creature } from "../types";

// Cão do Inferno (NV. 711 a 720) da área Abismo Uivante.
export const hellhound: Creature = {
  id: "hellhound",
  name: "Cão do Inferno",
  image: "/assets/creatures/howling-abyss/hellhound.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 711,
  health: 8443,
  strength: 1702,
  endurance: 1190,
  agility: 471,
  experience: 5024,
  minBronze: 1154,
  maxBronze: 2143,
  drops: [
    { itemId: "hellhound-fang", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "ember-pelt", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
