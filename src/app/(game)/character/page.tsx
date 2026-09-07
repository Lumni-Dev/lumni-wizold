import type { Metadata } from "next";
import { CharacterScreen } from "@/views/screens/character.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Character",
  description: "The hunter's sheet: attributes, equipment and vitals.",
  path: "/character",
});

export default function CharacterPage() {
  return <CharacterScreen />;
}
