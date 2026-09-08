import type { Metadata } from "next";
import { AlchemyScreen } from "@/views/screens/alchemy.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Alchemy",
  description: "Brew health and fury potions from the hunt's spoils at the Wizold cauldron.",
  path: "/alchemy",
});

export default function AlchemyPage() {
  return <AlchemyScreen />;
}
