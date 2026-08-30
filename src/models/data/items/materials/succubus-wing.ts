import type { Item } from "../../../entities/item";

export const succubusWing: Item = {
  id: "succubus-wing",
  name: "Asa de Súcubo",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  image: "/assets/inventory/materials/succubus-wing.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
