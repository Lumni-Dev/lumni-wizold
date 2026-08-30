import type { Item } from "../../../entities/item";

// Medalha do Capitão: despojo de caça, trocado por bronze no mercado.
export const captainMedal: Item = {
  id: "captain-medal",
  name: "Medalha do Capitão",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  image: "/assets/inventory/materials/captain-medal.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
