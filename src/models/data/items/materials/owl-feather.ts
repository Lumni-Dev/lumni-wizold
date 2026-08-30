import type { Item } from "../../../entities/item";

// Pena de Coruja: despojo de caça, trocado por bronze no mercado.
export const owlFeather: Item = {
  id: "owl-feather",
  name: "Pena de Coruja",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  image: "/assets/inventory/materials/owl-feather.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
