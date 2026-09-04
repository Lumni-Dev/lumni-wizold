import type { Item } from "../../../entities/item";

export const necroTome: Item = {
  id: "necro-tome",
  name: "Tomo Necromante",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
