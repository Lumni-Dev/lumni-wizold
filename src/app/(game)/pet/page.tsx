import type { Metadata } from "next";
import { PetScreen } from "@/views/screens/pet.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Mascote",
  description: "Adote, treine e leve seu lobo para a caça e a arena.",
  path: "/pet",
});

export default function PetPage() {
  return <PetScreen />;
}
