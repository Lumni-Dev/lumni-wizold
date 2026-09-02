import type { Item } from "../../../entities/item";

// Olho Aberrante: despojo de caça, trocado por bronze no mercado.
export const aberrantEye: Item = {
  id: "aberrant-eye",
  name: "Olho Aberrante",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
