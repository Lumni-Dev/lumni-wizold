import type { Metadata } from "next";
import { MarketScreen } from "@/views/screens/market.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Mercado",
  description: "Compre conjuntos, poções e rações com WCoins no mercado do Wizold.",
  path: "/market",
});

export default function MarketPage() {
  return <MarketScreen />;
}
