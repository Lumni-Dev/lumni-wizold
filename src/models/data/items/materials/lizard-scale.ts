import type { Item } from "../../../entities/item";

export const lizardScale: Item = {
  id: "lizard-scale",
  name: "Escama de Lagarto",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  image: "/assets/inventory/materials/lizard-scale.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
