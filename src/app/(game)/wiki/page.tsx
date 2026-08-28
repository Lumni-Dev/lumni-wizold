import type { Metadata } from "next";
import { WikiScreen } from "@/views/screens/wiki.screen";

export const metadata: Metadata = { title: "Wiki" };

export default function WikiPage() {
  return <WikiScreen />;
}
