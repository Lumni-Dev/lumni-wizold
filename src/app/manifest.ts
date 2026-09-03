import type { MetadataRoute } from "next";
import { GAME_NAME, GAME_TAGLINE } from "@/shared/constants/game";
import { BRAND_ICON_PATH, BRAND_LOGO_PNG_PATH } from "@/shared/constants/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: GAME_NAME + ": " + GAME_TAGLINE,
    short_name: GAME_NAME,
    description:
      "Jogo de navegador de lobisomem: caçada, treino, forja, arena e ranking de caçadores reais.",
    start_url: "/",
    scope: "/",
    display: "browser",
    lang: "pt-BR",
    orientation: "portrait-primary",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    categories: ["games", "entertainment"],
    icons: [
      {
        src: BRAND_ICON_PATH,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: BRAND_LOGO_PNG_PATH,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
