import type { Item } from "../../../entities/item";

export const dragonScale: Item = {
  id: "dragon-scale",
  name: "Escama de Dragão",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 2800,
  image: "/assets/inventory/materials/dragon-scale.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
