import type { Territory } from "./types";

export const paleSwamp: Territory = {
  id: "pale-swamp",
  name: "Pântano Pálido",
  description: "Água parada cor de chumbo e um cheiro doce de coisa afogada. O chão engole a bota e devolve bolha, e o que mora aqui aprendeu a esperar embaixo da lama até a presa passar. Cada passo é uma aposta, e a saída nunca fica onde você deixou.",
  species: "bear",
  minLevel: 301,
  maxLevel: 400,
  danger: "high",
  creatures: [
    "poison-toad",
    "mud-gator",
    "giant-leech",
    "swamp-serpent",
    "armored-lizard",
    "mosquito-swarm",
    "mud-man",
    "marsh-naga",
    "young-hydra",
    "swamp-witch",
  ],
};
