import type { Item } from "../../../entities/item";

export const wolfPelt: Item = {
  id: "wolf-pelt",
  name: "Pele de Lobo",
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
