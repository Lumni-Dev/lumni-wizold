import type { Item } from "../../../entities/item";

// Véu da Noiva: despojo de caça, trocado por bronze no mercado.
export const brideVeil: Item = {
  id: "bride-veil",
  name: "Véu da Noiva",
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
