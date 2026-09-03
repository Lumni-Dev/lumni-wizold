import type { Metadata } from "next";
import { GAME_NAME, GAME_TAGLINE } from "@/shared/constants/game";
import { OG_IMAGE_PATH, BRAND_ICON_PATH, BRAND_LOGO_PNG_PATH, SITE_URL } from "@/shared/constants/site";

export const SITE_DESCRIPTION =
  "Crônica de Lumni e Luna: jogo de navegador gratuito de lobisomem. Caçe criaturas, treine atributos, forje equipamentos e dispute o ranking.";

export const ROBOTS_INDEX: Metadata["robots"] = { index: true, follow: true };
export const ROBOTS_NOINDEX: Metadata["robots"] = { index: false, follow: false };

function fullTitle(title: string): string {
  return title === GAME_NAME ? GAME_NAME : GAME_NAME + " - " + title;
}

function socialImages(alt: string): NonNullable<Metadata["openGraph"]>["images"] {
  return [{ url: OG_IMAGE_PATH, width: 1280, height: 648, alt }];
}

export function rootMetadata(): Metadata {
  const alt = GAME_NAME + ": " + GAME_TAGLINE;
  const verification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: GAME_NAME,
      template: GAME_NAME + " - %s",
    },
    description: SITE_DESCRIPTION,
    applicationName: GAME_NAME,
    keywords: [
      "jogo de navegador",
      "lobisomem",
      "rpg online",
      "mmorpg",
      "caçador",
      "lua",
      GAME_NAME,
      "Lumni",
      "Luna",
    ],
    authors: [{ name: "Lumni", url: "https://lumni.dev.br" }],
    creator: "Lumni",
    publisher: "Lumni",
    category: "games",
    robots: ROBOTS_INDEX,
    alternates: {
      canonical: SITE_URL,
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: SITE_URL,
      siteName: GAME_NAME,
      title: GAME_NAME,
      description: SITE_DESCRIPTION,
      images: socialImages(alt),
    },
    twitter: {
      card: "summary_large_image",
      title: GAME_NAME,
      description: SITE_DESCRIPTION,
      images: [OG_IMAGE_PATH],
    },
    icons: {
      icon: [{ url: BRAND_ICON_PATH, type: "image/png" }],
      apple: [{ url: BRAND_LOGO_PNG_PATH, type: "image/png" }],
    },
    ...(verification ? { verification: { google: verification } } : {}),
  };
}

export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  robots?: Metadata["robots"];
}): Metadata {
  const title = fullTitle(input.title);
  const url = SITE_URL + input.path;
  const alt = title + " | " + GAME_TAGLINE;

  return {
    title: input.title,
    description: input.description,
    robots: input.robots ?? ROBOTS_INDEX,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url,
      siteName: GAME_NAME,
      title,
      description: input.description,
      images: socialImages(alt),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: input.description,
      images: [OG_IMAGE_PATH],
    },
  };
}

export function privatePageMetadata(input: { title: string; description: string; path: string }): Metadata {
  return pageMetadata({ ...input, robots: ROBOTS_NOINDEX });
}
