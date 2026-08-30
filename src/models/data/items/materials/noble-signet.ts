import type { Item } from "../../../entities/item";

// Anel de Nobre: despojo de caça, trocado por bronze no mercado.
export const nobleSignet: Item = {
  id: "noble-signet",
  name: "Anel de Nobre",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 1100,
  image: "/assets/inventory/materials/noble-signet.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
