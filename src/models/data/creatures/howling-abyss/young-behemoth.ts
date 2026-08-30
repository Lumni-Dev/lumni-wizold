import type { Creature } from "../types";

// Behemoth Jovem (NV. 761 a 770) da área Abismo Uivante.
export const youngBehemoth: Creature = {
  id: "young-behemoth",
  name: "Behemoth Jovem",
  image: "",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 761,
  health: 10870,
  strength: 1635,
  endurance: 1426,
  agility: 271,
  experience: 5374,
  minBronze: 1171,
  maxBronze: 2175,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
