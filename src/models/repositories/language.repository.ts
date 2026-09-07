import { detectLocale, type Locale, type LocaleChoice } from "@/shared/i18n/locale";

const CHOICE_KEY = "lumni-wizold:language";

const CHOICES: readonly LocaleChoice[] = ["auto", "pt", "en", "es"];

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export const languageRepository = {
  choice(): LocaleChoice {
    if (typeof window === "undefined") return "auto";
    try {
      const raw = window.localStorage.getItem(CHOICE_KEY);
      return CHOICES.includes(raw as LocaleChoice) ? (raw as LocaleChoice) : "auto";
    } catch {
      return "auto";
    }
  },

  setChoice(choice: LocaleChoice): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CHOICE_KEY, choice);
    } catch {}
    notify();
  },

  resolved(): Locale {
    const choice = languageRepository.choice();
    if (choice !== "auto") return choice;
    if (typeof navigator === "undefined") return "pt";
    return detectLocale(navigator.language);
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  serverChoiceSnapshot(): LocaleChoice {
    return "auto";
  },

  serverLocaleSnapshot(): Locale {
    return "pt";
  },
};
