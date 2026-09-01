import type { Item } from "../../../entities/item";

// Lasca de Osso: despojo de caça, trocado por bronze no mercado.
export const boneShard: Item = {
  id: "bone-shard",
  name: "Lasca de Osso",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  image: "/assets/inventory/materials/bone-shard.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
