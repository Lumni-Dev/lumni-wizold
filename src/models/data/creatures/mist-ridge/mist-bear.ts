import type { Creature } from "../types";

// Urso das Brumas (NV. 221 a 230) da área Serra das Brumas.
export const mistBear: Creature = {
  id: "mist-bear",
  name: "Urso das Brumas",
  image: "/assets/creatures/mist-ridge/mist-bear.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 221,
  health: 1925,
  strength: 33,
  endurance: 326,
  agility: 82,
  experience: 1594,
  minBronze: 134,
  maxBronze: 248,
  drops: [
    { itemId: "bear-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "bear-claw", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
