import type { Item } from "../../../entities/item";

// Placa de Quitina: despojo de caça, trocado por bronze no mercado.
export const chitinPlate: Item = {
  id: "chitin-plate",
  name: "Placa de Quitina",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  image: "/assets/inventory/materials/chitin-plate.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
