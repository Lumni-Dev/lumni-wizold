import type { Item } from "../../../entities/item";

// Coração de Dragão: despojo de caça, trocado por bronze no mercado.
export const dragonHeart: Item = {
  id: "dragon-heart",
  name: "Coração de Dragão",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 2800,
  image: "/assets/inventory/materials/dragon-heart.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
