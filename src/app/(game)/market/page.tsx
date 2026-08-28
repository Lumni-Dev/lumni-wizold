import type { Metadata } from "next";
import { MarketScreen } from "@/views/screens/market.screen";

export const metadata: Metadata = { title: "Mercado" };

export default function MarketPage() {
  return <MarketScreen />;
}
