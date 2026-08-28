import { ArtProvider } from "@/controllers/art.context";
import { readArtManifest } from "@/models/repositories/art.repository";
import { LandingScreen } from "@/views/screens/landing.screen";

export default async function HomePage() {
  const art = await readArtManifest();

  return (
    <ArtProvider manifest={art}>
      <LandingScreen />
    </ArtProvider>
  );
}
