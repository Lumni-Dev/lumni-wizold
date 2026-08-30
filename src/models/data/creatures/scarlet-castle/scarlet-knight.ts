import type { Creature } from "../types";

// Cavaleiro Escarlate (NV. 831 a 840) da área Castelo Escarlate.
export const scarletKnight: Creature = {
  id: "scarlet-knight",
  name: "Cavaleiro Escarlate",
  image: "/assets/creatures/scarlet-castle/scarlet-knight.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 831,
  health: 210374,
  strength: 315,
  endurance: 26769,
  agility: 295,
  experience: 5864,
  minBronze: 475,
  maxBronze: 883,
  drops: [
    { itemId: "scarlet-plate", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "cursed-plate", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
