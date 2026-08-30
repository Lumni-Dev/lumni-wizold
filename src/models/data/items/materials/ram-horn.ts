import type { Item } from "../../../entities/item";

// Chifre de Bode: despojo de caça, trocado por bronze no mercado.
export const ramHorn: Item = {
  id: "ram-horn",
  name: "Chifre de Bode",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 70,
  image: "/assets/inventory/materials/ram-horn.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
