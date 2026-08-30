import type { Item } from "../../../entities/item";

// Pata de Coelho: despojo de caça, trocado por bronze no mercado.
export const luckyFoot: Item = {
  id: "lucky-foot",
  name: "Pata de Coelho",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 70,
  image: "/assets/inventory/materials/lucky-foot.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
