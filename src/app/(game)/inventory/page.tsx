import type { Metadata } from "next";
import { InventoryScreen } from "@/views/screens/inventory.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Inventário",
  description: "Alforje, equipamento, consumíveis e materiais da sua crônica.",
  path: "/inventory",
});

export default function InventoryPage() {
  return <InventoryScreen />;
}
