import type { Metadata } from "next";
import { ArtProvider } from "@/controllers/art.context";
import { readArtManifest } from "@/models/repositories/art.repository";
import { GAME_NAME, GAME_TAGLINE } from "@/shared/constants/game";
import { OG_IMAGE_PATH, SITE_URL } from "@/shared/constants/site";
import { JsonLd } from "@/shared/seo/json-ld";
import { pageMetadata, SITE_DESCRIPTION } from "@/shared/seo/metadata";
import { LandingScreen } from "@/views/screens/landing.screen";

export const metadata: Metadata = pageMetadata({
  title: GAME_NAME,
  description:
    GAME_TAGLINE +
    ": jogo de navegador gratuito de lobisomem. Caçe criaturas sob a lua real, treine atributos, forje equipamentos e suba no ranking.",
  path: "/",
});

export default async function HomePage() {
  const art = await readArtManifest();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              name: GAME_NAME,
              alternateName: GAME_TAGLINE,
              url: SITE_URL,
              inLanguage: "pt-BR",
              description: SITE_DESCRIPTION,
            },
            {
              "@type": "VideoGame",
              name: GAME_NAME,
              alternateName: GAME_TAGLINE,
              url: SITE_URL,
              image: SITE_URL + OG_IMAGE_PATH,
              description: SITE_DESCRIPTION,
              inLanguage: "pt-BR",
              genre: ["RPG", "MMORPG"],
              gamePlatform: ["Web browser"],
              applicationCategory: "Game",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "BRL",
                availability: "https://schema.org/InStock",
              },
              publisher: {
                "@type": "Organization",
                name: "Lumni",
                url: "https://lumni.dev.br",
              },
            },
          ],
        }}
      />
      <ArtProvider manifest={art}>
        <LandingScreen />
      </ArtProvider>
    </>
  );
}
