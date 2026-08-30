import type { Territory } from "./types";

export const mistRidge: Territory = {
  id: "mist-ridge",
  name: "Serra das Brumas",
  description: "Pedra molhada, musgo e uma bruma que não levanta nem ao meio-dia. O rugido chega primeiro, bate na encosta e volta de outro lado, e você nunca sabe qual dos dois é o bicho. Os pastores subiam até aqui atrás de ovelha perdida; hoje trancam o portão e deixam a ovelha.",
  species: "bear",
  minLevel: 201,
  maxLevel: 300,
  danger: "high",
  creatures: [
    "mountain-goat",
    "royal-eagle",
    "mist-bear",
    "ridge-puma",
    "wild-ram",
    "peregrine-falcon",
    "young-yeti",
    "snow-wolf",
    "slope-ogre",
    "lesser-griffin",
  ],
};
