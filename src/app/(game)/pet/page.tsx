import type { Metadata } from "next";
import { PetScreen } from "@/views/screens/pet.screen";

export const metadata: Metadata = { title: "Mascote" };

export default function PetPage() {
  return <PetScreen />;
}
