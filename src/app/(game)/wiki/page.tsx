import type { Metadata } from "next";
import { GAME_NAME } from "@/shared/constants/game";
import { SITE_URL } from "@/shared/constants/site";
import { JsonLd } from "@/shared/seo/json-ld";
import { pageMetadata } from "@/shared/seo/metadata";
import { WikiScreen } from "@/views/screens/wiki.screen";

export const metadata: Metadata = pageMetadata({
  title: "Wiki",
  description:
    "Regras, números e catálogos do Wizold: combate, economia, forja, arena, taverna, lua e bestiário completo.",
  path: "/wiki",
});

export default function WikiPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: GAME_NAME + " — Wiki",
          url: SITE_URL + "/wiki",
          inLanguage: "pt-BR",
          description:
            "Enciclopédia do Wizold com regras de combate, economia, forja, arena, taverna e bestiário.",
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
