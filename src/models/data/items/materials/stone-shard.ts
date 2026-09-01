import type { Item } from "../../../entities/item";

// Lasca de Pedra: despojo de caça, trocado por bronze no mercado.
export const stoneShard: Item = {
  id: "stone-shard",
  name: "Lasca de Pedra",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  image: "/assets/inventory/materials/stone-shard.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
