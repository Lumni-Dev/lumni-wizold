import { GAME_NAME, GAME_TAGLINE } from "@/shared/constants/game";

export function GameFooter() {
  return (
    <footer className="mt-auto border-t border-edge bg-surface/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div className="min-w-0">
          <p className="heading text-[11px] text-ink">{GAME_NAME}</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">{GAME_TAGLINE}</p>
        </div>

        <p className="text-[11px] text-ink-faint">
          A partida inteira vive neste navegador: nada aqui foi para servidor nenhum.
        </p>
      </div>
    </footer>
  );
}
