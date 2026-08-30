import type { Item } from "../../../entities/item";

export const steelScrap: Item = {
  id: "steel-scrap",
  name: "Sucata de Aço",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  image: "/assets/inventory/materials/steel-scrap.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
