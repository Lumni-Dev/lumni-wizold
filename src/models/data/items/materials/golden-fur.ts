import type { Item } from "../../../entities/item";

// Pelo Dourado: despojo de caça, trocado por bronze no mercado.
export const goldenFur: Item = {
  id: "golden-fur",
  name: "Pelo Dourado",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 1100,
  image: "/assets/inventory/materials/golden-fur.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
