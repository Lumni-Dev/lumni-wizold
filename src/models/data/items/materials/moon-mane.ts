import type { Item } from "../../../entities/item";

// Crina Lunar: despojo de caça, trocado por bronze no mercado.
export const moonMane: Item = {
  id: "moon-mane",
  name: "Crina Lunar",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 4000,
  image: "/assets/inventory/materials/moon-mane.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
