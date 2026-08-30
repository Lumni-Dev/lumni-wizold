import type { Item } from "../../../entities/item";

export const behemothHide: Item = {
  id: "behemoth-hide",
  name: "Couro de Behemoth",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  image: "/assets/inventory/materials/behemoth-hide.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
