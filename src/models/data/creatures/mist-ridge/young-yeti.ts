import type { Creature } from "../types";

// Iéti Jovem (NV. 261 a 270) da área Serra das Brumas.
export const youngYeti: Creature = {
  id: "young-yeti",
  name: "Iéti Jovem",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 261,
  health: 2559,
  strength: 39,
  endurance: 433,
  agility: 96,
  experience: 1874,
  minBronze: 6,
  maxBronze: 10,
  drops: [
    { itemId: "yeti-fur", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "frost-heart", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
