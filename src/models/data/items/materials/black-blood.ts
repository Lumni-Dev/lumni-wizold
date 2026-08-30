import type { Item } from "../../../entities/item";

export const blackBlood: Item = {
  id: "black-blood",
  name: "Sangue Negro",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 2800,
  image: "/assets/inventory/materials/black-blood.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
