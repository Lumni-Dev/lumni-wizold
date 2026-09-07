import type { Metadata } from "next";
import { TavernScreen } from "@/views/screens/tavern.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Tavern",
  description: "Live chat tables, pack invites and private messages between companions.",
  path: "/tavern",
});

export default function TavernPage() {
  return <TavernScreen />;
}
