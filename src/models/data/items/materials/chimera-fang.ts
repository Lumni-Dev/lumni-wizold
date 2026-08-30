import type { Item } from "../../../entities/item";

// Presa de Quimera: despojo de caça, trocado por bronze no mercado.
export const chimeraFang: Item = {
  id: "chimera-fang",
  name: "Presa de Quimera",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 4000,
  image: "/assets/inventory/materials/chimera-fang.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
