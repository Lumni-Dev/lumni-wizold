import type { Item } from "../../../entities/item";

export const silverCharm: Item = {
  id: "silver-charm",
  name: "Amuleto de Prata",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  image: "/assets/inventory/materials/silver-charm.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
