import type { Metadata } from "next";
import { InventoryScreen } from "@/views/screens/inventory.screen";

export const metadata: Metadata = { title: "Inventário" };

export default function InventoryPage() {
  return <InventoryScreen />;
}
