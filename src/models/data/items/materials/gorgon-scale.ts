import type { Item } from "../../../entities/item";

// Escama de Górgona: despojo de caça, trocado por bronze no mercado.
export const gorgonScale: Item = {
  id: "gorgon-scale",
  name: "Escama de Górgona",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  image: "/assets/inventory/materials/gorgon-scale.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
