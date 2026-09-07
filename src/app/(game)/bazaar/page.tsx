import type { Metadata } from "next";
import { BazaarScreen } from "@/views/screens/bazaar.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Bazaar",
  description: "Buy and sell forged pieces and fragments for real money.",
  path: "/bazaar",
});

export default function BazaarPage() {
  return <BazaarScreen />;
}
