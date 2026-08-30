import type { Item } from "../../../entities/item";

// Fragmento de Alma: despojo de caça, trocado por bronze no mercado.
export const soulShard: Item = {
  id: "soul-shard",
  name: "Fragmento de Alma",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  image: "/assets/inventory/materials/soul-shard.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
