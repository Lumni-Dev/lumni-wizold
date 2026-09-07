export type Locale = "pt" | "en" | "es";
export type LocaleChoice = Locale | "auto";

export const LOCALES: readonly Locale[] = ["pt", "en", "es"];

export const LOCALE_LABELS: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
};

export function detectLocale(tag: string | null | undefined): Locale {
  const lower = (tag ?? "").toLowerCase();
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("en")) return "en";
  return "pt";
}
