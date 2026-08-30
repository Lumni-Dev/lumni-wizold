import type { Item } from "../../../entities/item";

// Espólio de Saqueador: despojo de caça, trocado por bronze no mercado.
export const raiderLoot: Item = {
  id: "raider-loot",
  name: "Espólio de Saqueador",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "rare",
  price: 300,
  image: "/assets/inventory/materials/raider-loot.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
