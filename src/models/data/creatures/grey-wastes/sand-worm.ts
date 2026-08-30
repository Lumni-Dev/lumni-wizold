import type { Creature } from "../types";

export const sandWorm: Creature = {
  id: "sand-worm",
  name: "Verme das Areias",
  image: "/assets/creatures/grey-wastes/sand-worm.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 541,
  health: 19814,
  strength: 96,
  endurance: 2521,
  agility: 194,
  experience: 3834,
  minBronze: 313,
  maxBronze: 581,
  drops: [
    { itemId: "worm-hide", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "sand-tooth", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
