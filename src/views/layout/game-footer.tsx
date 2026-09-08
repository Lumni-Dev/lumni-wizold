"use client";

import { useT } from "@/controllers/use-locale";
import { CornerAccents } from "@/views/components/corner-accents";
import { GAME_NAME, GAME_TAGLINE } from "@/shared/constants/game";
import { BRAND_ICON_PATH, SITE_EMAIL } from "@/shared/constants/site";
import { GAME_VERSION } from "@/shared/constants/version";

export function GameFooter() {
  const t = useT();
  return (
    <footer className="mx-auto mb-2.5 mt-auto w-full max-w-6xl px-4 md:px-8">
      <div className="relative">
      <div className="overflow-hidden rounded-lg border border-edge bg-surface/40">
      <div className="flex w-full flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND_ICON_PATH} alt={GAME_NAME} className="h-6 w-6 shrink-0 rounded-md" />
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">{t(GAME_TAGLINE)}</p>
        </div>

        <div className="space-y-1 sm:text-right">
          <p className="text-[11px] text-ink-faint">
            {t("Support:")}{" "}
            <a
              href={"mailto:" + SITE_EMAIL}
              className="text-ink-soft transition-colors hover:text-ink"
            >
              {SITE_EMAIL}
            </a>
          </p>
          <p className="font-mono text-[11px] text-ink-faint">v{GAME_VERSION}</p>
        </div>
      </div>
      </div>
      <CornerAccents />
      </div>
    </footer>
  );
}
