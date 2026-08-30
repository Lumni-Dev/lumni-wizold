import type { Item } from "../../../entities/item";

// Crina Prateada: despojo de caça, trocado por bronze no mercado.
export const silverMane: Item = {
  id: "silver-mane",
  name: "Crina Prateada",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 4000,
  image: "/assets/inventory/materials/silver-mane.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
