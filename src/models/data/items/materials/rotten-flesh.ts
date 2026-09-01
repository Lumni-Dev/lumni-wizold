import type { Item } from "../../../entities/item";

// Carne Podre: despojo de caça, trocado por bronze no mercado.
export const rottenFlesh: Item = {
  id: "rotten-flesh",
  name: "Carne Podre",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  image: "/assets/inventory/materials/rotten-flesh.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
