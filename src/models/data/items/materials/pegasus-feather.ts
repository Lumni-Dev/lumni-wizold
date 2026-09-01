import type { Item } from "../../../entities/item";

// Pena de Pégaso: despojo de caça, trocado por bronze no mercado.
export const pegasusFeather: Item = {
  id: "pegasus-feather",
  name: "Pena de Pégaso",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 2800,
  image: "/assets/inventory/materials/pegasus-feather.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
