import type { Item } from "../../../entities/item";

export const moltenRock: Item = {
  id: "molten-rock",
  name: "Rocha Fundida",
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
