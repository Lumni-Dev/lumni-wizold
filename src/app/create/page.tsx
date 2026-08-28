import type { Metadata } from "next";
import { ArtProvider } from "@/controllers/art.context";
import { readArtManifest } from "@/models/repositories/art.repository";
import { CharacterCreationScreen } from "@/views/screens/character-creation.screen";

export const metadata: Metadata = { title: "Criar personagem" };

export default async function CreatePage() {
  const art = await readArtManifest();

  return (
    <ArtProvider manifest={art}>
      <CharacterCreationScreen />
    </ArtProvider>
  );
}
