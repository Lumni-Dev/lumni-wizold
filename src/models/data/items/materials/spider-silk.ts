import type { Item } from "../../../entities/item";

export const spiderSilk: Item = {
  id: "spider-silk",
  name: "Seda de Aranha",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  image: "/assets/inventory/materials/spider-silk.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
