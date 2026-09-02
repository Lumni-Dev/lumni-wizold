import type { Item } from "../../../entities/item";

// Essência das Sombras: despojo de caça, trocado por bronze no mercado.
export const shadowEssence: Item = {
  id: "shadow-essence",
  name: "Essência das Sombras",
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
