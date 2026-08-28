import type { Metadata } from "next";
import { ArenaScreen } from "@/views/screens/arena.screen";

export const metadata: Metadata = { title: "Arena" };

export default function ArenaPage() {
  return <ArenaScreen />;
}
