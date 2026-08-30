import type { Item } from "../../../entities/item";

export const batFang: Item = {
  id: "bat-fang",
  name: "Presa de Morcego",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  image: "/assets/inventory/materials/bat-fang.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
