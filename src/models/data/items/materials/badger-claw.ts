import type { Item } from "../../../entities/item";

// Garra de Texugo: despojo de caça, trocado por bronze no mercado.
export const badgerClaw: Item = {
  id: "badger-claw",
  name: "Garra de Texugo",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "common",
  price: 15,
  image: "/assets/inventory/materials/badger-claw.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
