import type { Item } from "../../../entities/item";

// Lamento de Banshee: despojo de caça, trocado por bronze no mercado.
export const bansheeWail: Item = {
  id: "banshee-wail",
  name: "Lamento de Banshee",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  image: "/assets/inventory/materials/banshee-wail.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
