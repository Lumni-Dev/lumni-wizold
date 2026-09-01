import type { Item } from "../../../entities/item";

// Glândula de Veneno: despojo de caça, trocado por bronze no mercado.
export const venomGland: Item = {
  id: "venom-gland",
  name: "Glândula de Veneno",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  image: "/assets/inventory/materials/venom-gland.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
