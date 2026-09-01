import type { Item } from "../../../entities/item";

// Chifre de Cabra: despojo de caça, trocado por bronze no mercado.
export const goatHorn: Item = {
  id: "goat-horn",
  name: "Chifre de Cabra",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  image: "/assets/inventory/materials/goat-horn.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
