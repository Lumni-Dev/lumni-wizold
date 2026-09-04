import type { Item } from "../../../entities/item";

export const gargoyleStone: Item = {
  id: "gargoyle-stone",
  name: "Pedra de Gárgula",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
