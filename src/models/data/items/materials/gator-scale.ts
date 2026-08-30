import type { Item } from "../../../entities/item";

// Escama de Jacaré: despojo de caça, trocado por bronze no mercado.
export const gatorScale: Item = {
  id: "gator-scale",
  name: "Escama de Jacaré",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 300,
  image: "/assets/inventory/materials/gator-scale.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
