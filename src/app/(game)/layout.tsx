import { ArtProvider } from "@/controllers/art.context";
import { readArtManifest } from "@/models/repositories/art.repository";
import { GameFrame } from "@/views/layout/game-frame";

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const art = await readArtManifest();

  return (
    <ArtProvider manifest={art}>
      <GameFrame>{children}</GameFrame>
    </ArtProvider>
  );
}
