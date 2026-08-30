import type { Creature } from "../types";

// Arqueiro de Prata (NV. 431 a 440) da área Estrada dos Caçadores.
export const silverArcher: Creature = {
  id: "silver-archer",
  name: "Arqueiro de Prata",
  image: "",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 431,
  health: 5136,
  strength: 1032,
  endurance: 723,
  agility: 289,
  experience: 3064,
  minBronze: 742,
  maxBronze: 1378,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
