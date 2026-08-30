import type { Item } from "../../../entities/item";

export const bloodGrimoire: Item = {
  id: "blood-grimoire",
  name: "Grimório de Sangue",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  image: "/assets/inventory/materials/blood-grimoire.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
