import type { Territory } from "./types";

export const dewWoods: Territory = {
  id: "dew-woods",
  name: "Mata do Orvalho",
  description: "Árvores baixas e chão que nunca seca, guardando cada pegada como se fosse prova. A neblina rala engana a vista, mas não o faro, e o veado sabe disso: ele para, escuta e some antes de você levantar a cabeça. Quem volta de mãos vazias daqui costuma repetir o mesmo erro na semana seguinte.",
  species: "deer",
  minLevel: 101,
  maxLevel: 200,
  danger: "moderate",
  creatures: [
    "young-deer",
    "brown-owl",
    "grey-wolf",
    "wood-boar",
    "green-serpent",
    "young-bear",
    "wildcat",
    "twisted-antler-stag",
    "giant-spider",
    "starving-pack",
  ],
};
