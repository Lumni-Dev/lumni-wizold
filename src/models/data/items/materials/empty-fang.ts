import type { Item } from "../../../entities/item";

// Presa Vazia: despojo de caça, trocado por bronze no mercado.
export const emptyFang: Item = {
  id: "empty-fang",
  name: "Presa Vazia",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 300,
  image: "/assets/inventory/materials/empty-fang.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
