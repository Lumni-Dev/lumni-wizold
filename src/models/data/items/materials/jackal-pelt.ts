import type { Item } from "../../../entities/item";

// Pele de Chacal: despojo de caça, trocado por bronze no mercado.
export const jackalPelt: Item = {
  id: "jackal-pelt",
  name: "Pele de Chacal",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 70,
  image: "/assets/inventory/materials/jackal-pelt.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
