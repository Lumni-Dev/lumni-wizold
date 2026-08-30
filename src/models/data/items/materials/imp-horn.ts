import type { Item } from "../../../entities/item";

// Chifre de Imp: despojo de caça, trocado por bronze no mercado.
export const impHorn: Item = {
  id: "imp-horn",
  name: "Chifre de Imp",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  image: "/assets/inventory/materials/imp-horn.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
