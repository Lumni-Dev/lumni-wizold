import type { Item } from "../../../entities/item";

// Fragmento de Auréola: despojo de caça, trocado por bronze no mercado.
export const haloShard: Item = {
  id: "halo-shard",
  name: "Fragmento de Auréola",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 2800,
  image: "/assets/inventory/materials/halo-shard.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
