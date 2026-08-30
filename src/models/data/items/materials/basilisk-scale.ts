import type { Item } from "../../../entities/item";

export const basiliskScale: Item = {
  id: "basilisk-scale",
  name: "Escama de Basilisco",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  image: "/assets/inventory/materials/basilisk-scale.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
