import type { Item } from "../../../entities/item";

// Presa Afiada: despojo de caça, trocado por bronze no mercado.
export const sharpFang: Item = {
  id: "sharp-fang",
  name: "Presa Afiada",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "common",
  price: 15,
  image: "/assets/inventory/materials/sharp-fang.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
