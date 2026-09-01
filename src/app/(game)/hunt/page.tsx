import type { Metadata } from "next";
import { HuntScreen } from "@/views/screens/hunt.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Caça",
  description: "Escolha um território e caçe criaturas sob a lua real.",
  path: "/hunt",
});

export default function HuntPage() {
  return <HuntScreen />;
}
