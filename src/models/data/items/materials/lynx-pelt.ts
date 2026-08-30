import type { Item } from "../../../entities/item";

// Pele de Lince: despojo de caça, trocado por bronze no mercado.
export const lynxPelt: Item = {
  id: "lynx-pelt",
  name: "Pele de Lince",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 70,
  image: "/assets/inventory/materials/lynx-pelt.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
