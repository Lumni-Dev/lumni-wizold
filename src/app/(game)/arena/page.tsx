import type { Metadata } from "next";
import { ArenaScreen } from "@/views/screens/arena.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Arena",
  description: "Challenge real hunters in the pit and fight for WCoins per victory.",
  path: "/arena",
});

export default function ArenaPage() {
  return <ArenaScreen />;
}
