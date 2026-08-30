import type { Item } from "../../../entities/item";

export const wormHide: Item = {
  id: "worm-hide",
  name: "Couro de Verme",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  image: "/assets/inventory/materials/worm-hide.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
