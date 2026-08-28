import type { Metadata } from "next";
import { StoreScreen } from "@/views/screens/store.screen";

export const metadata: Metadata = { title: "Wizold Store" };

export default function StorePage() {
  return <StoreScreen />;
}
