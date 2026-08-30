import type { Item } from "../../../entities/item";

// Presa de Basilisco: despojo de caça, trocado por bronze no mercado.
export const basiliskFang: Item = {
  id: "basilisk-fang",
  name: "Presa de Basilisco",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 1100,
  image: "/assets/inventory/materials/basilisk-fang.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
