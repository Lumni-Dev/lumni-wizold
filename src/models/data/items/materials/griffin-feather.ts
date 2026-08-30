import type { Item } from "../../../entities/item";

// Pena de Grifo: despojo de caça, trocado por bronze no mercado.
export const griffinFeather: Item = {
  id: "griffin-feather",
  name: "Pena de Grifo",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 300,
  image: "/assets/inventory/materials/griffin-feather.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
