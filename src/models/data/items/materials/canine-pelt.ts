import type { Item } from "../../../entities/item";

// Pele Canina: despojo de caça, trocado por bronze no mercado.
export const caninePelt: Item = {
  id: "canine-pelt",
  name: "Pele Canina",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "common",
  price: 15,
  image: "/assets/inventory/materials/canine-pelt.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
