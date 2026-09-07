import type { Item } from "../../../entities/item";

export const deerHide: Item = {
  id: "deer-hide",
  name: "Deer Hide",
  description:
    "Spoils of the hunt. Worth the bronze the market pays for it; no use as a weapon or an ornament.",
  category: "material",
  rarity: "common",
  price: 10,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
