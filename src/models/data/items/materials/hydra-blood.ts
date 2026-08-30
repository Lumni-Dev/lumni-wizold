import type { Item } from "../../../entities/item";

// Sangue de Hidra: despojo de caça, trocado por bronze no mercado.
export const hydraBlood: Item = {
  id: "hydra-blood",
  name: "Sangue de Hidra",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "epic",
  price: 1100,
  image: "/assets/inventory/materials/hydra-blood.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
