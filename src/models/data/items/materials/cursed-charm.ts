import type { Item } from "../../../entities/item";

// Amuleto Amaldiçoado: despojo de caça, trocado por bronze no mercado.
export const cursedCharm: Item = {
  id: "cursed-charm",
  name: "Amuleto Amaldiçoado",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  image: "/assets/inventory/materials/cursed-charm.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
