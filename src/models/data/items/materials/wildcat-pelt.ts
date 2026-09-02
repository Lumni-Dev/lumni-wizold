import type { Item } from "../../../entities/item";

// Pele de Gato Selvagem: despojo de caça, trocado por bronze no mercado.
export const wildcatPelt: Item = {
  id: "wildcat-pelt",
  name: "Pele de Gato Selvagem",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
