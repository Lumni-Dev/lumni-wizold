import type { Item } from "../../../entities/item";

export const bearClaw: Item = {
  id: "bear-claw",
  name: "Garra de Urso",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  image: "/assets/inventory/materials/bear-claw.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
