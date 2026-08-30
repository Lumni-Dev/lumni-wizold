import type { Item } from "../../../entities/item";

// Pele de Lobo: despojo de caça, trocado por bronze no mercado.
export const wolfPelt: Item = {
  id: "wolf-pelt",
  name: "Pele de Lobo",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 70,
  image: "/assets/inventory/materials/wolf-pelt.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
