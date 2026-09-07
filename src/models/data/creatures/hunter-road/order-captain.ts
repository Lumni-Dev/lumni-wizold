import type { Creature } from "../types";

export const orderCaptain: Creature = {
  id: "order-captain",
  name: "Captain of the Order",
  description: "Hunters, mercenaries and fanatics. They come with silver, fire and method.",
  species: "human",
  level: 481,
  health: 11861,
  strength: 84,
  endurance: 1777,
  agility: 247,
  experience: 3414,
  minBronze: 9,
  maxBronze: 17,
  drops: [
    { itemId: "captain-medal", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "knight-plate", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
