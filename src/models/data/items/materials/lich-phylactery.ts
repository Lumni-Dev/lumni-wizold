import type { Item } from "../../../entities/item";

// Filactério de Lich: despojo de caça, trocado por bronze no mercado.
export const lichPhylactery: Item = {
  id: "lich-phylactery",
  name: "Filactério de Lich",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 4000,
  image: "/assets/inventory/materials/lich-phylactery.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
