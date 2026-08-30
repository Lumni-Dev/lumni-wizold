import type { Territory } from "./types";

export const villageField: Territory = {
  id: "village-field",
  name: "Campo do Vilarejo",
  description: "Capim alto atrás das últimas casas, onde o cheiro de fumaça ainda alcança. As crianças cortam caminho por aqui de dia e juram que nunca viram nada; à noite, ninguém estranha um vulto correndo entre as cercas. É onde quase todo lobo aprende a caçar, porque aqui o erro custa pouco.",
  species: "rabbit",
  minLevel: 1,
  maxLevel: 100,
  danger: "low",
  creatures: [
    "field-rabbit",
    "barn-rat",
    "wild-hen",
    "thief-fox",
    "hungry-crow",
    "wild-dog",
    "fierce-boar",
    "wheat-snake",
    "furious-badger",
    "forest-lynx",
  ],
};
