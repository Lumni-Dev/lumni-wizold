import type { Item } from "../../../entities/item";

export const ogreTooth: Item = {
  id: "ogre-tooth",
  name: "Dente de Ogro",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  image: "/assets/inventory/materials/ogre-tooth.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
