import type { Metadata } from "next";
import { TavernScreen } from "@/views/screens/tavern.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Taverna",
  description: "Mesas de chat ao vivo, convites de matilha e mensagens privadas entre companheiros.",
  path: "/tavern",
});

export default function TavernPage() {
  return <TavernScreen />;
}
