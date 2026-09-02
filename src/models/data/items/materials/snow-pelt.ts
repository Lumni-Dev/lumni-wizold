import type { Item } from "../../../entities/item";

// Pele Nevada: despojo de caça, trocado por bronze no mercado.
export const snowPelt: Item = {
  id: "snow-pelt",
  name: "Pele Nevada",
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
