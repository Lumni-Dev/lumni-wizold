import type { Item } from "../../../entities/item";

export const shadowEssence: Item = {
  id: "shadow-essence",
  name: "Essência das Sombras",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  image: "/assets/inventory/materials/shadow-essence.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
