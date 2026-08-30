import type { Item } from "../../../entities/item";

// Troféu do Mestre: despojo de caça, trocado por bronze no mercado.
export const masterTrophy: Item = {
  id: "master-trophy",
  name: "Troféu do Mestre",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 1100,
  image: "/assets/inventory/materials/master-trophy.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
