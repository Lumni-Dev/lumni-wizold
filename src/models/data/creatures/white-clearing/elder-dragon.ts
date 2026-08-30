import type { Creature } from "../types";

// Dragão Ancião (NV. 961 a 970) da área Clareira Branca.
export const elderDragon: Creature = {
  id: "elder-dragon",
  name: "Dragão Ancião",
  image: "/assets/creatures/white-clearing/elder-dragon.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 961,
  health: 475608,
  strength: 474,
  endurance: 60517,
  agility: 341,
  experience: 6774,
  minBronze: 548,
  maxBronze: 1018,
  drops: [
    { itemId: "dragon-scale", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "dragon-heart", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
