import type { Item } from "../../../entities/item";

// Couro de Verme: despojo de caça, trocado por bronze no mercado.
export const wormHide: Item = {
  id: "worm-hide",
  name: "Couro de Verme",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
