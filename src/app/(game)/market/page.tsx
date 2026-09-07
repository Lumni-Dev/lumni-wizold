import type { Metadata } from "next";
import { MarketScreen } from "@/views/screens/market.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Market",
  description: "Buy sets, potions and rations with WCoins at the Wizold market.",
  path: "/market",
});

export default function MarketPage() {
  return <MarketScreen />;
}
