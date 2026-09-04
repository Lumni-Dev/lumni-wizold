import type { Item } from "../../../entities/item";

export const dragonHeart: Item = {
  id: "dragon-heart",
  name: "Coração de Dragão",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 2800,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
