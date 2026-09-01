import type { Metadata } from "next";
import { ArtProvider } from "@/controllers/art.context";
import { readArtManifest } from "@/models/repositories/art.repository";
import { privatePageMetadata } from "@/shared/seo/metadata";
import { CharacterCreationScreen } from "@/views/screens/character-creation.screen";

export const metadata: Metadata = privatePageMetadata({
  title: "Criar personagem",
  description: "Crie seu caçador e escolha a linhagem Lumni ou Luna.",
  path: "/create",
});

export default async function CreatePage() {
  const art = await readArtManifest();

  return (
    <ArtProvider manifest={art}>
      <CharacterCreationScreen />
    </ArtProvider>
  );
}
