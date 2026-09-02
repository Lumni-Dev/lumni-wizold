import type { Creature } from "../types";

// Cavaleiro Errante (NV. 461 a 470) da área Estrada dos Caçadores.
export const wanderingKnight: Creature = {
  id: "wandering-knight",
  name: "Cavaleiro Errante",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 461,
  health: 12915,
  strength: 77,
  endurance: 1644,
  agility: 166,
  experience: 3274,
  minBronze: 8,
  maxBronze: 16,
  drops: [
    { itemId: "knight-plate", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "steel-scrap", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
