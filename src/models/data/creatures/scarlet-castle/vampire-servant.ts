import type { Creature } from "../types";

export const vampireServant: Creature = {
  id: "vampire-servant",
  name: "Servo Vampiro",
  image: "/assets/creatures/scarlet-castle/vampire-servant.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 801,
  health: 141242,
  strength: 282,
  endurance: 17240,
  agility: 529,
  experience: 5654,
  minBronze: 458,
  maxBronze: 852,
  drops: [
    { itemId: "empty-fang", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "pale-blood", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
