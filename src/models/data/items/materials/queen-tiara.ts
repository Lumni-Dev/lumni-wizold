import type { Item } from "../../../entities/item";

// Tiara da Rainha: despojo de caça, trocado por bronze no mercado.
export const queenTiara: Item = {
  id: "queen-tiara",
  name: "Tiara da Rainha",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 2800,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
