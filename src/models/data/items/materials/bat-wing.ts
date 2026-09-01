import type { Item } from "../../../entities/item";

// Asa de Morcego: despojo de caça, trocado por bronze no mercado.
export const batWing: Item = {
  id: "bat-wing",
  name: "Asa de Morcego",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  image: "/assets/inventory/materials/bat-wing.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
