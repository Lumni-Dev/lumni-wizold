import type { Metadata } from "next";
import { HuntScreen } from "@/views/screens/hunt.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Hunt",
  description: "Choose a territory and hunt creatures under the real moon.",
  path: "/hunt",
});

export default function HuntPage() {
  return <HuntScreen />;
}
