import type { Item } from "../../../entities/item";

export const talon: Item = {
  id: "talon",
  name: "Garra",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "common",
  price: 10,
  image: "/assets/inventory/materials/talon.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
