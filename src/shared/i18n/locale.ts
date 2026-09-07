export type Locale = "pt" | "en" | "es";
export type LocaleChoice = Locale | "auto";

export const LOCALES: readonly Locale[] = ["en", "pt", "es"];

export const LOCALE_LABELS: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
};

// English is the game's main language: anything that is not Portuguese or
// Spanish reads it. Portuguese survives as a translation, not as the default.
export function detectLocale(tag: string | null | undefined): Locale {
  const lower = (tag ?? "").toLowerCase();
  if (lower.startsWith("pt")) return "pt";
  if (lower.startsWith("es")) return "es";
  return "en";
}
