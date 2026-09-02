import type { Item } from "../../../entities/item";

// Escama de Hidra: despojo de caça, trocado por bronze no mercado.
export const hydraScale: Item = {
  id: "hydra-scale",
  name: "Escama de Hidra",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
