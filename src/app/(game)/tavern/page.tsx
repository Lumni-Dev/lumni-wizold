import type { Metadata } from "next";
import { TavernScreen } from "@/views/screens/tavern.screen";

export const metadata: Metadata = { title: "Taverna" };

export default function TavernPage() {
  return <TavernScreen />;
}
