"use client";

import { useCallback, useSyncExternalStore } from "react";
import { languageRepository } from "@/models/repositories/language.repository";
import { translate } from "@/shared/i18n/dictionary";
import type { Locale, LocaleChoice } from "@/shared/i18n/locale";

export function useLocale(): Locale {
  return useSyncExternalStore(
    languageRepository.subscribe,
    languageRepository.resolved,
    languageRepository.serverLocaleSnapshot,
  );
}

export function useLanguageChoice(): LocaleChoice {
  return useSyncExternalStore(
    languageRepository.subscribe,
    languageRepository.choice,
    languageRepository.serverChoiceSnapshot,
  );
}

export function useT(): (text: string) => string {
  const locale = useLocale();
  return useCallback((text: string) => translate(text, locale), [locale]);
}
