import type { Metadata } from "next";
import { InventoryScreen } from "@/views/screens/inventory.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Inventory",
  description: "Saddlebag, equipment, consumables and materials of your chronicle.",
  path: "/inventory",
});

export default function InventoryPage() {
  return <InventoryScreen />;
}
