const DEFAULT_SITE_URL = "https://wizold.lumni.dev.br";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/$/, "");

export const SITE_EMAIL = "wizold@lumni.dev.br";

export const OG_IMAGE_PATH = "/assets/ui/background.jpg";

/** Bumped when logo or favicon files change; busts the immutable /assets cache. */
export const BRAND_ASSET_VERSION = "6";

export const BRAND_ICON_PATH = "/assets/ui/favicon.png?v=" + BRAND_ASSET_VERSION;
export const BRAND_LOGO_WEBP_PATH = "/assets/ui/logo.webp?v=" + BRAND_ASSET_VERSION;
export const BRAND_LOGO_PNG_PATH = "/assets/ui/logo.png?v=" + BRAND_ASSET_VERSION;
