import type { Item } from "../../../entities/item";

// Sangue de Sanguessuga: despojo de caça, trocado por bronze no mercado.
export const leechBlood: Item = {
  id: "leech-blood",
  name: "Sangue de Sanguessuga",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  image: "/assets/inventory/materials/leech-blood.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
