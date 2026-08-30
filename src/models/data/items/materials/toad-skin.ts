import type { Item } from "../../../entities/item";

export const toadSkin: Item = {
  id: "toad-skin",
  name: "Pele de Sapo",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  image: "/assets/inventory/materials/toad-skin.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
