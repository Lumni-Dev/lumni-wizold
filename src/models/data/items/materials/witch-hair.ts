import type { Item } from "../../../entities/item";

export const witchHair: Item = {
  id: "witch-hair",
  name: "Cabelo de Bruxa",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  image: "/assets/inventory/materials/witch-hair.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
