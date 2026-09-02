import type { Item } from "../../../entities/item";

// Correia de Couro: despojo de caça, trocado por bronze no mercado.
export const leatherStrap: Item = {
  id: "leather-strap",
  name: "Correia de Couro",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
