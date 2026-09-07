import type { Metadata } from "next";
import { ForgeScreen } from "@/views/screens/forge.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Forge",
  description: "Mine fragments and forge the bag's pieces to raise attributes.",
  path: "/forge",
});

export default function ForgePage() {
  return <ForgeScreen />;
}
