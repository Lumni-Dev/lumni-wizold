import type { Creature } from "../types";

// Verme das Areias (NV. 541 a 550) da área Ermo Cinza.
export const sandWorm: Creature = {
  id: "sand-worm",
  name: "Verme das Areias",
  image: "/assets/creatures/grey-wastes/sand-worm.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 541,
  health: 7222,
  strength: 1089,
  endurance: 947,
  agility: 194,
  experience: 3834,
  minBronze: 780,
  maxBronze: 1448,
  drops: [
    { itemId: "worm-hide", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "sand-tooth", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
