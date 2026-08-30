import type { Item } from "../../../entities/item";

// Coroa do Conde: despojo de caça, trocado por bronze no mercado.
export const countCrown: Item = {
  id: "count-crown",
  name: "Coroa do Conde",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 2800,
  image: "/assets/inventory/materials/count-crown.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
