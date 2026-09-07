import type { Metadata } from "next";
import { StoreScreen } from "@/views/screens/store.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Wizold Store",
  description: "WCoin packs for real money to speed up training and equipment.",
  path: "/store",
});

export default function StorePage() {
  return <StoreScreen />;
}
