import type { Item } from "../../../entities/item";

// Presa de Morcego: despojo de caça, trocado por bronze no mercado.
export const batFang: Item = {
  id: "bat-fang",
  name: "Presa de Morcego",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 70,
  image: "/assets/inventory/materials/bat-fang.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
