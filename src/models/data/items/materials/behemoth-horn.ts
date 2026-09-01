import type { Item } from "../../../entities/item";

// Chifre de Behemoth: despojo de caça, trocado por bronze no mercado.
export const behemothHorn: Item = {
  id: "behemoth-horn",
  name: "Chifre de Behemoth",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  image: "/assets/inventory/materials/behemoth-horn.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
