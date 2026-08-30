import type { Item } from "../../../entities/item";

// Placa Escarlate: despojo de caça, trocado por bronze no mercado.
export const scarletPlate: Item = {
  id: "scarlet-plate",
  name: "Placa Escarlate",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  image: "/assets/inventory/materials/scarlet-plate.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
