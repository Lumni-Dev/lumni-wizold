import type { Item } from "../../../entities/item";

// Pena Negra: despojo de caça, trocado por bronze no mercado.
export const blackFeather: Item = {
  id: "black-feather",
  name: "Pena Negra",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "common",
  price: 10,
  image: "/assets/inventory/materials/black-feather.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
