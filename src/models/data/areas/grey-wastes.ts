import type { Territory } from "./types";

export const greyWastes: Territory = {
  id: "grey-wastes",
  name: "Ermo Cinza",
  description: "Terra rachada até o horizonte, sem sombra e sem água, só osso branco marcando quem tentou atravessar. O vento carrega areia e voz, e nem sempre a voz é de gente viva. Aqui se caça o que caça você, porque parar é virar marco de estrada.",
  species: "human",
  minLevel: 501,
  maxLevel: 600,
  danger: "extreme",
  creatures: [
    "carrion-vulture",
    "wastes-hyena",
    "giant-scorpion",
    "starving-jackal",
    "sand-worm",
    "wild-raider",
    "lesser-gorgon",
    "stone-golem",
    "basilisk",
    "wastes-lord",
  ],
};
