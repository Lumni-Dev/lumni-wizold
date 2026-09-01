import type { Item } from "../../../entities/item";

// Núcleo de Lava: despojo de caça, trocado por bronze no mercado.
export const lavaCore: Item = {
  id: "lava-core",
  name: "Núcleo de Lava",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  image: "/assets/inventory/materials/lava-core.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
