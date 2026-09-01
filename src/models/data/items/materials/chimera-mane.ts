import type { Item } from "../../../entities/item";

// Juba de Quimera: despojo de caça, trocado por bronze no mercado.
export const chimeraMane: Item = {
  id: "chimera-mane",
  name: "Juba de Quimera",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 2800,
  image: "/assets/inventory/materials/chimera-mane.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
