import type { Item } from "../../../entities/item";

export const spectralAntler: Item = {
  id: "spectral-antler",
  name: "Chifre Espectral",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 750,
  image: "/assets/inventory/materials/spectral-antler.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
