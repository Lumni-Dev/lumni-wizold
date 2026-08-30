import type { Creature } from "../types";

// Urso das Brumas (NV. 221 a 230) da área Serra das Brumas.
export const mistBear: Creature = {
  id: "mist-bear",
  name: "Urso das Brumas",
  image: "",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 221,
  health: 1517,
  strength: 234,
  endurance: 198,
  agility: 82,
  experience: 1594,
  minBronze: 204,
  maxBronze: 379,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
