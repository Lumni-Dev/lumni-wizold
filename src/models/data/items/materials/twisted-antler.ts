import type { Item } from "../../../entities/item";

// Chifre Torto: despojo de caça, trocado por bronze no mercado.
export const twistedAntler: Item = {
  id: "twisted-antler",
  name: "Chifre Torto",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 70,
  image: "/assets/inventory/materials/twisted-antler.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
