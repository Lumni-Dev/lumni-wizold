import type { Item } from "../../../entities/item";

// Pena: despojo de caça, trocado por bronze no mercado.
export const feather: Item = {
  id: "feather",
  name: "Pena",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "common",
  price: 15,
  image: "/assets/inventory/materials/feather.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
