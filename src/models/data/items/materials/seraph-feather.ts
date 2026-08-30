import type { Item } from "../../../entities/item";

// Pena de Serafim: despojo de caça, trocado por bronze no mercado.
export const seraphFeather: Item = {
  id: "seraph-feather",
  name: "Pena de Serafim",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 4000,
  image: "/assets/inventory/materials/seraph-feather.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
