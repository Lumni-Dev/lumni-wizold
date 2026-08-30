import type { Item } from "../../../entities/item";

// Presa de Lobo: despojo de caça, trocado por bronze no mercado.
export const wolfFang: Item = {
  id: "wolf-fang",
  name: "Presa de Lobo",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 70,
  image: "/assets/inventory/materials/wolf-fang.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
