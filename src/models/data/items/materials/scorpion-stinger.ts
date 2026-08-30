import type { Item } from "../../../entities/item";

// Ferrão de Escorpião: despojo de caça, trocado por bronze no mercado.
export const scorpionStinger: Item = {
  id: "scorpion-stinger",
  name: "Ferrão de Escorpião",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  image: "/assets/inventory/materials/scorpion-stinger.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
