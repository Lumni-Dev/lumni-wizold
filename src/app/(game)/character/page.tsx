import type { Metadata } from "next";
import { CharacterScreen } from "@/views/screens/character.screen";

export const metadata: Metadata = { title: "Personagem" };

export default function CharacterPage() {
  return <CharacterScreen />;
}
