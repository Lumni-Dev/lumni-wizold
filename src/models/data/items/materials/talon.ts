import type { Item } from "../../../entities/item";

// Garra: despojo de caça, trocado por bronze no mercado.
export const talon: Item = {
  id: "talon",
  name: "Garra",
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
