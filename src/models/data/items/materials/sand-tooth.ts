import type { Item } from "../../../entities/item";

// Dente de Areia: despojo de caça, trocado por bronze no mercado.
export const sandTooth: Item = {
  id: "sand-tooth",
  name: "Dente de Areia",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 300,
  image: "/assets/inventory/materials/sand-tooth.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
