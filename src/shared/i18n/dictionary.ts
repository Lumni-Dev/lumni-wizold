import { EN } from "./en";
import { ES } from "./es";
import type { Locale } from "./locale";

const MAPS: Record<Exclude<Locale, "pt">, Record<string, string>> = { en: EN, es: ES };

export function translate(text: string, locale: Locale): string {
  if (locale === "pt") return text;
  return MAPS[locale][text] ?? text;
}
