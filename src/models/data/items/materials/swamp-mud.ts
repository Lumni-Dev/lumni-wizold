import type { Item } from "../../../entities/item";

// Lama do Pântano: despojo de caça, trocado por bronze no mercado.
export const swampMud: Item = {
  id: "swamp-mud",
  name: "Lama do Pântano",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  image: "/assets/inventory/materials/swamp-mud.png",
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
