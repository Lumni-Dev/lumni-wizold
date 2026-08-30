import type { Creature } from "../types";

// Iéti Jovem (NV. 261 a 270) da área Serra das Brumas.
export const youngYeti: Creature = {
  id: "young-yeti",
  name: "Iéti Jovem",
  image: "/assets/creatures/mist-ridge/young-yeti.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 261,
  health: 1606,
  strength: 250,
  endurance: 209,
  agility: 96,
  experience: 1874,
  minBronze: 218,
  maxBronze: 405,
  drops: [
    { itemId: "yeti-fur", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "frost-heart", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
