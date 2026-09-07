import type { Item } from "../../../entities/item";

export const toadSkin: Item = {
  id: "toad-skin",
  name: "Toad Skin",
  description:
    "Spoils of the hunt. Worth the bronze the market pays for it; no use as a weapon or an ornament.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
