import type { Item } from "../../../entities/item";

// Pó de Chifre: despojo de caça, trocado por bronze no mercado.
export const hornDust: Item = {
  id: "horn-dust",
  name: "Pó de Chifre",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 2800,
  image: "/assets/inventory/materials/horn-dust.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
