import type { Item } from "../../../entities/item";

// Flecha de Prata: despojo de caça, trocado por bronze no mercado.
export const silverArrow: Item = {
  id: "silver-arrow",
  name: "Flecha de Prata",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 300,
  image: "/assets/inventory/materials/silver-arrow.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
