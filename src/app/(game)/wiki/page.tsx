import type { Metadata } from "next";
import { GAME_NAME } from "@/shared/constants/game";
import { SITE_URL } from "@/shared/constants/site";
import { JsonLd } from "@/shared/seo/json-ld";
import { pageMetadata } from "@/shared/seo/metadata";
import { WikiScreen } from "@/views/screens/wiki.screen";

export const metadata: Metadata = pageMetadata({
  title: "Wiki",
  description:
    "Rules, numbers and catalogs of Wizold: combat, economy, forge, arena, tavern, moon and the full bestiary.",
  path: "/wiki",
});

export default function WikiPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: GAME_NAME + ": Wiki",
          url: SITE_URL + "/wiki",
          inLanguage: "pt-BR",
          description:
            "The Wizold encyclopedia with rules of combat, economy, forge, arena, tavern and bestiary.",
          isPartOf: {
            "@type": "WebSite",
            name: GAME_NAME,
            url: SITE_URL,
          },
        }}
      />
      <WikiScreen />
    </>
  );
}
