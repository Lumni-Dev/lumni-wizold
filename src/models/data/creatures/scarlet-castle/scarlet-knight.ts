import type { Creature } from "../types";

// Cavaleiro Escarlate (NV. 831 a 840) da área Castelo Escarlate.
export const scarletKnight: Creature = {
  id: "scarlet-knight",
  name: "Cavaleiro Escarlate",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 831,
  health: 26860,
  strength: 3804,
  endurance: 2704,
  agility: 295,
  experience: 5864,
  minBronze: 2180,
  maxBronze: 4048,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
