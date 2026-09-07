import { STORE } from "@/shared/config/economy";

export interface StorePack {
  id: string;
  name: string;
  description: string;
  bronze: number;
  priceCents: number;
  highlight: boolean;
}

export const STORE_PACKS: readonly StorePack[] = [
  {
    id: "one-pouch",
    name: "One WCoin Purse",
    description:
      "A short push to close the missing purchase, without the night of hunting that would pay for it.",
    bronze: STORE.onePouch,
    priceCents: 490,
    highlight: false,
  },
  {
    id: "two-pouches",
    name: "Two WCoin Purses",
    description:
      "The middle purse: enough to change gear mid-climb without stopping the training.",
    bronze: STORE.twoPouches,
    priceCents: 1990,
    highlight: true,
  },
  {
    id: "three-pouches",
    name: "Three WCoin Purses",
    description:
      "The store's biggest purse, with anvil room to spare after the purchase. It is the longest shortcut it sells.",
    bronze: STORE.threePouches,
    priceCents: 4990,
    highlight: false,
  },
];

export function findPack(id: string): StorePack | undefined {
  return STORE_PACKS.find((pack) => pack.id === id);
}
