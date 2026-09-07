import type { Item } from "../../../entities/item";

export const captainMedal: Item = {
  id: "captain-medal",
  name: "Captain's Medal",
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
