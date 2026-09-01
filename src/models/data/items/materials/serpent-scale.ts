import type { Item } from "../../../entities/item";

// Escama de Serpente: despojo de caça, trocado por bronze no mercado.
export const serpentScale: Item = {
  id: "serpent-scale",
  name: "Escama de Serpente",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  image: "/assets/inventory/materials/serpent-scale.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
