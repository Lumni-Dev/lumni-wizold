import type { Item } from "../../../entities/item";

// Pena de Falcão: despojo de caça, trocado por bronze no mercado.
export const falconFeather: Item = {
  id: "falcon-feather",
  name: "Pena de Falcão",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  image: "/assets/inventory/materials/falcon-feather.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
