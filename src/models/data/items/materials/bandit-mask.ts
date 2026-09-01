import type { Item } from "../../../entities/item";

// Máscara de Bandido: despojo de caça, trocado por bronze no mercado.
export const banditMask: Item = {
  id: "bandit-mask",
  name: "Máscara de Bandido",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  image: "/assets/inventory/materials/bandit-mask.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
