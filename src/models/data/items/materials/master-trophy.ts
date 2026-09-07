import type { Item } from "../../../entities/item";

export const masterTrophy: Item = {
  id: "master-trophy",
  name: "Master's Trophy",
  description:
    "Spoils of the hunt. Worth the bronze the market pays for it; no use as a weapon or an ornament.",
  category: "material",
  rarity: "epic",
  price: 750,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
