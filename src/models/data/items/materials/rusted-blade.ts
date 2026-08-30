import type { Item } from "../../../entities/item";

// Lâmina Enferrujada: despojo de caça, trocado por bronze no mercado.
export const rustedBlade: Item = {
  id: "rusted-blade",
  name: "Lâmina Enferrujada",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 70,
  image: "/assets/inventory/materials/rusted-blade.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
