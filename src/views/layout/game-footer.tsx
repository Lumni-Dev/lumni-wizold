import { GAME_NAME, GAME_TAGLINE } from "@/shared/constants/game";
import { BRAND_ICON_PATH, SITE_EMAIL } from "@/shared/constants/site";
import { GAME_VERSION } from "@/shared/constants/version";

export function GameFooter() {
  return (
    <footer className="mt-auto border-t border-edge bg-surface/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div className="flex min-w-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND_ICON_PATH} alt={GAME_NAME} className="h-6 w-6 shrink-0 rounded-md" />
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">{GAME_TAGLINE}</p>
        </div>

        <div className="space-y-1 sm:text-right">
          <p className="text-[11px] text-ink-faint">
            Suporte:{" "}
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
    </footer>
  );
}
