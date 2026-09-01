import type { Metadata } from "next";
import { ArenaScreen } from "@/views/screens/arena.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Arena",
  description: "Desafie caçadores reais no fosso e dispute WCoins por vitória.",
  path: "/arena",
});

export default function ArenaPage() {
  return <ArenaScreen />;
}
