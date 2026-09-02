import type { Item } from "../../../entities/item";

// Coroa do Ermo: despojo de caça, trocado por bronze no mercado.
export const wastesCrown: Item = {
  id: "wastes-crown",
  name: "Coroa do Ermo",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
