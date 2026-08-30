import type { Creature } from "../types";

// Golem de Pedra (NV. 571 a 580) da área Ermo Cinza.
export const stoneGolem: Creature = {
  id: "stone-golem",
  name: "Golem de Pedra",
  image: "",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 571,
  health: 7306,
  strength: 1104,
  endurance: 958,
  agility: 204,
  experience: 4044,
  minBronze: 791,
  maxBronze: 1468,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
