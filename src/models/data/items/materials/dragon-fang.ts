import type { Item } from "../../../entities/item";

// Presa de Dragão: despojo de caça, trocado por bronze no mercado.
export const dragonFang: Item = {
  id: "dragon-fang",
  name: "Presa de Dragão",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 4000,
  image: "/assets/inventory/materials/dragon-fang.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
