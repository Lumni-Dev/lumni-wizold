import type { Item } from "../../../entities/item";

// Asa de Mosquito: despojo de caça, trocado por bronze no mercado.
export const mosquitoWing: Item = {
  id: "mosquito-wing",
  name: "Asa de Mosquito",
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
