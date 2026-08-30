import type { Item } from "../../../entities/item";

export const holyWater: Item = {
  id: "holy-water",
  name: "Água Benta",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  image: "/assets/inventory/materials/holy-water.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
