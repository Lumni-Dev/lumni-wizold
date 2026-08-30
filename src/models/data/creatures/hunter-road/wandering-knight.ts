import type { Creature } from "../types";

// Cavaleiro Errante (NV. 461 a 470) da área Estrada dos Caçadores.
export const wanderingKnight: Creature = {
  id: "wandering-knight",
  name: "Cavaleiro Errante",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 461,
  health: 8791,
  strength: 1263,
  endurance: 884,
  agility: 166,
  experience: 3274,
  minBronze: 752,
  maxBronze: 1397,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
