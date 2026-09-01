import type { Metadata } from "next";
import { CharacterScreen } from "@/views/screens/character.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Personagem",
  description: "Ficha do caçador: atributos, equipamento, vitals e forma humana ou lobisomem.",
  path: "/character",
});

export default function CharacterPage() {
  return <CharacterScreen />;
}
