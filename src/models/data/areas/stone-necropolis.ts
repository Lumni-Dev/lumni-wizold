import type { Territory } from "./types";

export const stoneNecropolis: Territory = {
  id: "stone-necropolis",
  name: "Necrópole de Pedra",
  description: "Criptas abertas de propósito, as tampas encostadas com o cuidado de quem pretende voltar. Não há terra revirada nem corpo faltando, e ainda assim o lugar cheira a coisa recente. Alguém deixou a porta assim para você, e está esperando desde muito antes de você nascer.",
  species: "vampire",
  minLevel: 601,
  maxLevel: 700,
  danger: "extreme",
  creatures: [
    "skeleton-warrior",
    "crawling-zombie",
    "specter",
    "ghoul",
    "dead-knight",
    "banshee",
    "necromancer",
    "gargoyle",
    "lesser-lich",
    "crypt-guardian",
  ],
};
