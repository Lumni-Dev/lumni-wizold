import type { Item } from "../../../entities/item";

// Couro Grosso: despojo de caça, trocado por bronze no mercado.
export const thickHide: Item = {
  id: "thick-hide",
  name: "Couro Grosso",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "common",
  price: 15,
  image: "/assets/inventory/materials/thick-hide.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
