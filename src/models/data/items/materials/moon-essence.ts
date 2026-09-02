import type { Item } from "../../../entities/item";

// Essência da Lua: despojo de caça, trocado por bronze no mercado.
export const moonEssence: Item = {
  id: "moon-essence",
  name: "Essência da Lua",
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: "legendary",
  price: 2800,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
