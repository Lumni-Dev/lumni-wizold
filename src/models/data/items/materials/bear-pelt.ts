import type { Item } from "../../../entities/item";

// Pele de Urso: despojo de caça, trocado por bronze no mercado.
export const bearPelt: Item = {
  id: "bear-pelt",
  name: "Pele de Urso",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  image: "/assets/inventory/materials/bear-pelt.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
