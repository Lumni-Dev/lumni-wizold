const DEFAULT_SITE_URL = "https://wizold.com.br";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/$/, "");

export const SITE_EMAIL = "wizold@lumni.dev.br";

/** Bumped when logo or favicon files change; busts the immutable /assets cache. */
export const BRAND_ASSET_VERSION = "6";

export const BRAND_ICON_PATH = "/assets/ui/favicon.png?v=" + BRAND_ASSET_VERSION;

/** Link-preview thumbnail: the same square mark as the favicon. */
export const OG_IMAGE_PATH = BRAND_ICON_PATH;
export const OG_IMAGE_WIDTH = 700;
export const OG_IMAGE_HEIGHT = 700;
export const BRAND_LOGO_WEBP_PATH = "/assets/ui/logo.webp?v=" + BRAND_ASSET_VERSION;
export const BRAND_LOGO_PNG_PATH = "/assets/ui/logo.png?v=" + BRAND_ASSET_VERSION;

export const TAVERN_MUG_VERSION = "2";
export const TAVERN_MUG_PATH = "/assets/ui/caneca.webp?v=" + TAVERN_MUG_VERSION;
export const TAVERN_MUG_PNG_PATH = "/assets/ui/caneca.png?v=" + TAVERN_MUG_VERSION;
