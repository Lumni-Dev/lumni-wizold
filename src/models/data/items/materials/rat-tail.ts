import type { Item } from "../../../entities/item";

// Rabo de Rato: despojo de caça, trocado por bronze no mercado.
export const ratTail: Item = {
  id: "rat-tail",
  name: "Rabo de Rato",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "common",
  price: 10,
  image: "/assets/inventory/materials/rat-tail.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
