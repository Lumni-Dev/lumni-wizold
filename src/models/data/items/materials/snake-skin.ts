import type { Item } from "../../../entities/item";

export const snakeSkin: Item = {
  id: "snake-skin",
  name: "Pele de Cobra",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "common",
  price: 10,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
