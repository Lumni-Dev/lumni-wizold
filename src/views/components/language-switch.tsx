"use client";

import { useLocale } from "@/controllers/use-locale";
import { languageRepository } from "@/models/repositories/language.repository";
import { LOCALES, LOCALE_LABELS } from "@/shared/i18n/locale";
import { cn } from "@/shared/utils/class-names";
import { Chip } from "./chip";

export function LanguageSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  return (
    <div className={cn("flex gap-2", className)}>
      {LOCALES.map((entry) => (
        <Chip
          key={entry}
          active={locale === entry}
          aria-label={LOCALE_LABELS[entry]}
          onClick={() => languageRepository.setChoice(entry)}
        >
          {entry.toUpperCase()}
        </Chip>
      ))}
    </div>
  );
}
