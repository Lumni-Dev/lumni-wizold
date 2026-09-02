import type { Item } from "../../../entities/item";

// Presa de Javali: despojo de caça, trocado por bronze no mercado.
export const boarTusk: Item = {
  id: "boar-tusk",
  name: "Presa de Javali",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
