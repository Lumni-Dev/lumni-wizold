import type { Item } from "../../../entities/item";

// Pelo de Coelho: despojo de caça, trocado por bronze no mercado.
export const rabbitFur: Item = {
  id: "rabbit-fur",
  name: "Pelo de Coelho",
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
