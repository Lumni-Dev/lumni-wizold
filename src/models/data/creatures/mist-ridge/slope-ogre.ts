import type { Creature } from "../types";

// Ogro da Encosta (NV. 281 a 290) da área Serra das Brumas.
export const slopeOgre: Creature = {
  id: "slope-ogre",
  name: "Ogro da Encosta",
  image: "/assets/creatures/mist-ridge/slope-ogre.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 281,
  health: 2875,
  strength: 41,
  endurance: 486,
  agility: 103,
  experience: 2014,
  minBronze: 314,
  maxBronze: 584,
  drops: [
    { itemId: "ogre-tooth", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
