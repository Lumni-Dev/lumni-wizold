"use client";

import { useT } from "@/controllers/use-locale";
import { COMPANY } from "@/shared/constants/company";
import { GAME_TAGLINE } from "@/shared/constants/game";
import { ActionIcon } from "../components/app-icon";
import { BackToTop } from "./back-to-top";
import { cn } from "@/shared/utils/class-names";

export function Footer({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const year = new Date().getFullYear();

  if (compact) {
    return (
      <footer className="landing-hero-shadow-text space-y-3 text-center">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">{t(GAME_TAGLINE)}</p>
        <p className="text-[11px] leading-relaxed text-ink-faint">
          {t("A game by")}{" "}
          <a
            href={COMPANY.site}
            target="_blank"
            rel="noreferrer"
            className="text-ink-soft transition-colors hover:text-ink"
          >
            {COMPANY.name}
          </a>
          . {t(COMPANY.description)}
        </p>
        <p className="text-[11px] text-ink-faint">
          {COMPANY.legalName} · CNPJ {COMPANY.taxId}
        </p>
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          © {year} {COMPANY.name}. {t("All rights reserved.")}
        </p>
        <nav
          aria-label={t("Lumni contact")}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
        >
          {COMPANY.channels.map((channel) => (
            <a
              key={channel.kind}
              href={channel.href}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 text-[11px] text-ink-soft transition-colors hover:text-ink"
            >
              <ActionIcon
                action={channel.kind}
                className="text-ink-faint transition-colors group-hover:text-ink"
              />
              {channel.value}
            </a>
          ))}
        </nav>
        <nav aria-label={t("Legal")} className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={COMPANY.privacyUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-ink-soft transition-colors hover:text-ink"
          >
            {t("Privacy")}
          </a>
          <a
            href={COMPANY.termsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-ink-soft transition-colors hover:text-ink"
          >
            {t("Terms")}
          </a>
        </nav>
      </footer>
    );
  }

  return (
    <footer className="relative mt-auto border-t border-edge bg-surface/40">
      <div className="mx-auto w-full max-w-5xl p-4 md:px-8 md:py-8">
        <div className="max-w-md space-y-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">{t(GAME_TAGLINE)}</p>
          <p className="text-[11px] leading-relaxed text-ink-faint">
            {t("A game by")}{" "}
            <a
              href={COMPANY.site}
              target="_blank"
              rel="noreferrer"
              className="text-ink-soft transition-colors hover:text-ink"
            >
              {COMPANY.name}
            </a>
            . {t(COMPANY.description)}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-6 border-t border-edge pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] text-ink-faint">
              {COMPANY.legalName} - CNPJ {COMPANY.taxId}
            </p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              © {year} {COMPANY.name}. {t("All rights reserved.")}
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 sm:items-end">
            <nav aria-label={t("Lumni contact")} className="space-y-3 sm:text-right">
              <h2 className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                {t("Contact")}
              </h2>
              <ul className="space-y-2">
                {COMPANY.channels.map((channel) => (
                  <li key={channel.kind}>
                    <a
                      href={channel.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center gap-2 text-[11px] text-ink-soft transition-colors hover:text-ink sm:flex-row-reverse"
                    >
                      <ActionIcon
                        action={channel.kind}
                        className="text-ink-faint transition-colors group-hover:text-ink"
                      />
                      {channel.value}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <nav
              aria-label={t("Legal")}
              className={cn("flex flex-wrap items-center gap-4 sm:justify-end")}
            >
              <a
                href={COMPANY.privacyUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-ink-soft transition-colors hover:text-ink"
              >
                {t("Privacy")}
              </a>
              <a
                href={COMPANY.termsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-ink-soft transition-colors hover:text-ink"
              >
                {t("Terms")}
              </a>
              <BackToTop />
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
