import type { Item } from "../../../entities/item";

// Seda Sombria: despojo de caça, trocado por bronze no mercado.
export const shadowSilk: Item = {
  id: "shadow-silk",
  name: "Seda Sombria",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 300,
  image: "/assets/inventory/materials/shadow-silk.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
