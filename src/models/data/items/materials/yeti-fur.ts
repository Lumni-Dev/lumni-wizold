import type { Item } from "../../../entities/item";

// Pelo de Iéti: despojo de caça, trocado por bronze no mercado.
export const yetiFur: Item = {
  id: "yeti-fur",
  name: "Pelo de Iéti",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 300,
  image: "/assets/inventory/materials/yeti-fur.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
