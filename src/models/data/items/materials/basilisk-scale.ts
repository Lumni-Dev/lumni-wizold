import type { Item } from "../../../entities/item";

// Escama de Basilisco: despojo de caça, trocado por bronze no mercado.
export const basiliskScale: Item = {
  id: "basilisk-scale",
  name: "Escama de Basilisco",
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
