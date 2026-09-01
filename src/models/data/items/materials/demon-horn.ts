import type { Item } from "../../../entities/item";

// Chifre de Demônio: despojo de caça, trocado por bronze no mercado.
export const demonHorn: Item = {
  id: "demon-horn",
  name: "Chifre de Demônio",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  image: "/assets/inventory/materials/demon-horn.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
