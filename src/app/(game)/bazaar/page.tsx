import type { Metadata } from "next";
import { BazaarScreen } from "@/views/screens/bazaar.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Bazar",
  description: "Compre e venda peças forjadas e fragmentos por dinheiro real.",
  path: "/bazaar",
});

export default function BazaarPage() {
  return <BazaarScreen />;
}
