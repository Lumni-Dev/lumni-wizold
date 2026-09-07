import type { Metadata } from "next";
import { PetScreen } from "@/views/screens/pet.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Companion",
  description: "Adopt, train and take your wolf to the hunt and the arena.",
  path: "/pet",
});

export default function PetPage() {
  return <PetScreen />;
}
