import type { Item } from "../../../entities/item";

// Pele de Hiena: despojo de caça, trocado por bronze no mercado.
export const hyenaPelt: Item = {
  id: "hyena-pelt",
  name: "Pele de Hiena",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 70,
  image: "/assets/inventory/materials/hyena-pelt.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
