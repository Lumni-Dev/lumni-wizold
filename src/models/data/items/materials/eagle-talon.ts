import type { Item } from "../../../entities/item";

// Garra de Águia: despojo de caça, trocado por bronze no mercado.
export const eagleTalon: Item = {
  id: "eagle-talon",
  name: "Garra de Águia",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 300,
  image: "/assets/inventory/materials/eagle-talon.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
