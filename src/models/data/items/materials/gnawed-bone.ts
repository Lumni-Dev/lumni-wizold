import type { Item } from "../../../entities/item";

// Osso Roído: despojo de caça, trocado por bronze no mercado.
export const gnawedBone: Item = {
  id: "gnawed-bone",
  name: "Osso Roído",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "common",
  price: 10,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
