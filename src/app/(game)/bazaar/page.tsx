import type { Metadata } from "next";
import { BazaarScreen } from "@/views/screens/bazaar.screen";

export const metadata: Metadata = { title: "Bazar" };

export default function BazaarPage() {
  return <BazaarScreen />;
}
