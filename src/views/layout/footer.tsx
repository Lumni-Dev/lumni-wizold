"use client";

import { useT } from "@/controllers/use-locale";
import { COMPANY } from "@/shared/constants/company";
import { ActionIcon } from "../components/app-icon";

export function Footer({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer
      className={
        compact
          ? "landing-hero-shadow-text space-y-3 text-center"
          : "relative mt-auto border-t border-edge bg-surface/40"
      }
    >
      <div className={compact ? undefined : "mx-auto w-full max-w-5xl space-y-3 p-4 text-center md:px-8 md:py-8"}>
        <p className="text-[11px] text-ink-faint">
          {COMPANY.legalName} · CNPJ {COMPANY.taxId}
        </p>
        <p className="text-[10px] text-ink-faint">
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
      </div>
    </footer>
  );
}
