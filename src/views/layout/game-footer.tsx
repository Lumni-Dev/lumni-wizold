import { GAME_NAME, GAME_TAGLINE } from "@/shared/constants/game";

export function GameFooter() {
  return (
    <footer className="mt-auto border-t border-edge bg-surface/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div className="min-w-0">
          <p className="heading text-[11px] text-ink">{GAME_NAME}</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">{GAME_TAGLINE}</p>
        </div>

        <div className="space-y-1 sm:text-right">
          <p className="text-[11px] text-ink-faint">
            A partida vive no servidor de Wizold e te espera em qualquer navegador.
          </p>
          <p className="text-[11px] text-ink-faint">
            Suporte:{" "}
            <a
              href="mailto:wizold@lumni.dev.br"
              className="text-ink-soft transition-colors hover:text-ink"
            >
              wizold@lumni.dev.br
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
