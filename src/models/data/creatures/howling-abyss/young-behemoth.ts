import type { Creature } from "../types";

export const youngBehemoth: Creature = {
  id: "young-behemoth",
  name: "Behemoth Jovem",
  image: "/assets/creatures/howling-abyss/young-behemoth.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 761,
  health: 97842,
  strength: 214,
  endurance: 12450,
  agility: 271,
  experience: 5374,
  minBronze: 436,
  maxBronze: 810,
  drops: [
    { itemId: "behemoth-hide", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "behemoth-horn", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
