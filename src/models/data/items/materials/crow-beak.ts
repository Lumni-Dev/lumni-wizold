import type { Item } from "../../../entities/item";

export const crowBeak: Item = {
  id: "crow-beak",
  name: "Bico de Corvo",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "common",
  price: 10,
  image: "/assets/inventory/materials/crow-beak.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
