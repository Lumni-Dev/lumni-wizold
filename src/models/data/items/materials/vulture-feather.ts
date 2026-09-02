import type { Item } from "../../../entities/item";

// Pena de Abutre: despojo de caça, trocado por bronze no mercado.
export const vultureFeather: Item = {
  id: "vulture-feather",
  name: "Pena de Abutre",
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
