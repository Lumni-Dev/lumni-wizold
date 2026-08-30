import type { Territory } from "./types";

export const hunterRoad: Territory = {
  id: "hunter-road",
  name: "Estrada dos Caçadores",
  description: "Tochas em fila até onde a vista alcança e correntes de prata penduradas nos galhos, tilintando com o vento para avisar quem passa. Não é armadilha para bicho, é recado. Eles vêm em grupo, dormem em turnos e sabem exatamente o que estão caçando.",
  species: "human",
  minLevel: 401,
  maxLevel: 500,
  danger: "high",
  creatures: [
    "novice-hunter",
    "road-scout",
    "mercenary",
    "silver-archer",
    "hunting-hound",
    "masked-bandit",
    "wandering-knight",
    "inquisitor",
    "order-captain",
    "master-hunter",
  ],
};
