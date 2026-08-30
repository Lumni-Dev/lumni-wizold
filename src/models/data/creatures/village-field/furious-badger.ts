import type { Creature } from "../types";

// Texugo Furioso (NV. 81 a 90) da área Campo do Vilarejo.
export const furiousBadger: Creature = {
  id: "furious-badger",
  name: "Texugo Furioso",
  image: "/assets/creatures/village-field/furious-badger.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 81,
  health: 243,
  strength: 40,
  endurance: 30,
  agility: 33,
  experience: 614,
  minBronze: 35,
  maxBronze: 64,
  drops: [
    { itemId: "badger-claw", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
