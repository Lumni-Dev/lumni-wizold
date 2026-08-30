import type { Item } from "../../../entities/item";

// Pele de Rival: despojo de caça, trocado por bronze no mercado.
export const rivalPelt: Item = {
  id: "rival-pelt",
  name: "Pele de Rival",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 1100,
  image: "/assets/inventory/materials/rival-pelt.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
