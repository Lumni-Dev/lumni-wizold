import type { Item } from "../../../entities/item";

// Mapa do Batedor: despojo de caça, trocado por bronze no mercado.
export const scoutMap: Item = {
  id: "scout-map",
  name: "Mapa do Batedor",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 200,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
