import type { Item } from "../../../entities/item";

export const badgerClaw: Item = {
  id: "badger-claw",
  name: "Garra de Texugo",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "common",
  price: 10,
  image: "/assets/inventory/materials/badger-claw.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
