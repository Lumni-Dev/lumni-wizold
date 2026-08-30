import type { Item } from "../../../entities/item";

// Dente de Jacaré: despojo de caça, trocado por bronze no mercado.
export const gatorTooth: Item = {
  id: "gator-tooth",
  name: "Dente de Jacaré",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 300,
  image: "/assets/inventory/materials/gator-tooth.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
