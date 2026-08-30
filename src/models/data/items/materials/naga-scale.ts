import type { Item } from "../../../entities/item";

// Escama de Naga: despojo de caça, trocado por bronze no mercado.
export const nagaScale: Item = {
  id: "naga-scale",
  name: "Escama de Naga",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  image: "/assets/inventory/materials/naga-scale.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
