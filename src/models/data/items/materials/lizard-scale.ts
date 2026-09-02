import type { Item } from "../../../entities/item";

// Escama de Lagarto: despojo de caça, trocado por bronze no mercado.
export const lizardScale: Item = {
  id: "lizard-scale",
  name: "Escama de Lagarto",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
