import type { Item } from "../../../entities/item";

export const reaperScythe: Item = {
  id: "reaper-scythe",
  name: "Foice do Ceifador",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 2800,
  image: "/assets/inventory/materials/reaper-scythe.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
