import type { Territory } from "./types";

export const scarletCastle: Territory = {
  id: "scarlet-castle",
  name: "Castelo Escarlate",
  description: "Portões abertos de par em par, velas acesas em corredor que ninguém varre há um século. A mesa está posta, o vinho é vermelho demais, e o dono desce a escada sem pressa, porque a noite é dele e você chegou cedo. Aqui a fera é a convidada, não a anfitriã.",
  species: "vampire",
  minLevel: 801,
  maxLevel: 900,
  danger: "extreme",
  creatures: [
    "vampire-servant",
    "giant-bat",
    "night-noble",
    "scarlet-knight",
    "blood-sorceress",
    "rival-werewolf",
    "elder-vampire",
    "bloody-bride",
    "scarlet-count",
    "night-queen",
  ],
};
