const DEFAULT_SITE_URL = "https://wizold.lumni.dev.br";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/$/, "");

export const SITE_EMAIL = "wizold@lumni.dev.br";

export const OG_IMAGE_PATH = "/assets/ui/background.jpg";
