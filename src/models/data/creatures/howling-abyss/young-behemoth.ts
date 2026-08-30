import type { Creature } from "../types";

// Behemoth Jovem (NV. 761 a 770) da área Abismo Uivante.
export const youngBehemoth: Creature = {
  id: "young-behemoth",
  name: "Behemoth Jovem",
  image: "/assets/creatures/howling-abyss/young-behemoth.png",
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
    { itemId: "behemoth-hide", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "behemoth-horn", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
