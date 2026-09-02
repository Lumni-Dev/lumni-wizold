import type { Item } from "../../../entities/item";

// Núcleo de Golem: despojo de caça, trocado por bronze no mercado.
export const golemCore: Item = {
  id: "golem-core",
  name: "Núcleo de Golem",
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
