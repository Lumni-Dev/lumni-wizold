import type { Item } from "../../../entities/item";

// Sangue Pálido: despojo de caça, trocado por bronze no mercado.
export const paleBlood: Item = {
  id: "pale-blood",
  name: "Sangue Pálido",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  image: "/assets/inventory/materials/pale-blood.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
