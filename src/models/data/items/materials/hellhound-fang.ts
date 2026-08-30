import type { Item } from "../../../entities/item";

// Presa Infernal: despojo de caça, trocado por bronze no mercado.
export const hellhoundFang: Item = {
  id: "hellhound-fang",
  name: "Presa Infernal",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 1100,
  image: "/assets/inventory/materials/hellhound-fang.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
