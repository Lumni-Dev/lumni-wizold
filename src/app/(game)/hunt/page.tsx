import type { Metadata } from "next";
import { HuntScreen } from "@/views/screens/hunt.screen";

export const metadata: Metadata = { title: "Caça" };

export default function HuntPage() {
  return <HuntScreen />;
}
