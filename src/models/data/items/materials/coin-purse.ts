import type { Item } from "../../../entities/item";

export const coinPurse: Item = {
  id: "coin-purse",
  name: "Bolsa de Moedas",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  image: "/assets/inventory/materials/coin-purse.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
