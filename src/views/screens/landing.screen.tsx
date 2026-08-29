"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { LORE_CHAPTERS, LORE_COUPLE, LORE_PILLARS } from "@/models/data/lore";
import { PREVIEW_SHOTS } from "@/models/data/preview";
import { GAME_NAME, GAME_TAGLINE } from "@/shared/constants/game";
import { cn } from "@/shared/utils/class-names";
import { ActionIcon } from "../components/app-icon";
import { CornerAccents } from "../components/corner-accents";
import { GenderBanner } from "../components/gender-icon";
import { PreviewGallery } from "../components/preview-gallery";
import { Footer } from "../layout/footer";

function PlayButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-md border border-ember bg-ember px-8 text-xs font-medium uppercase tracking-[0.16em] text-base shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] transition-[filter] hover:brightness-110"
    >
      {label}
    </Link>
  );
}

function useNarration() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      audio.current?.pause();
      audio.current = null;
    };
  }, []);

  function toggle(source: string) {
    if (audio.current && current === source) {
      audio.current.pause();
      setCurrent(null);
      return;
    }

    audio.current?.pause();
    const element = new Audio(source);
    element.addEventListener("ended", () => setCurrent(null));
    audio.current = element;
    void element.play().catch(() => setCurrent(null));
    setCurrent(source);
  }

  return { current, toggle };
}

const CHAPTER_NUMBERS = ["I", "II", "III", "IV"];

function NarrationButton({ playing, onClick }: { playing: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={playing ? "Parar a narração" : "Ouvir este capítulo"}
      className="inline-flex h-6 shrink-0 items-center gap-2 rounded-md border border-edge px-2 text-[10px] uppercase tracking-[0.16em] text-ink-faint transition-colors hover:border-edge-strong hover:text-ink"
    >
      <ActionIcon action={playing ? "pause" : "play"} className="h-3 w-3" />
      {playing ? "Parar" : "Ouvir"}
    </button>
  );
}

export function LandingScreen() {
  const { ready, character } = useGame();
  const hasRun = ready && character !== null;
  const narration = useNarration();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="space-y-2">
          <p className="font-logo text-lg uppercase tracking-[0.22em] text-highlight md:text-2xl">
            {GAME_NAME}
          </p>
          <p className="text-[11px] uppercase tracking-[0.24em] text-ink-faint">{GAME_TAGLINE}</p>
        </div>

        <p className="mx-auto max-w-xl text-sm leading-relaxed text-ink-soft">
          Dois se encontraram numa noite de lua cheia e desceram a serra sendo outra coisa. A
          matilha que eles começaram ainda caça, e a lua que decide o preço de cada noite é a que
          está no céu agora, lá fora.
        </p>

        <div className="flex flex-col items-center gap-3">
          {hasRun ? (
            <>
              <PlayButton href="/character" label={"Continuar com " + character.name} />
              <Link
                href="/create"
                className="text-[11px] uppercase tracking-[0.16em] text-ink-faint transition-colors hover:text-ink"
              >
                Começar outra partida
              </Link>
            </>
          ) : (
            <PlayButton href="/login" label="Jogar grátis" />
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-16 px-4 py-16 md:px-8 md:py-24">
        <section className="relative">
          <div className="overflow-hidden rounded-lg border border-edge bg-surface/80">
            <div className="grid border-b border-edge sm:grid-cols-2">
              {(["male", "female"] as const).map((key) => (
                <div
                  key={key}
                  className={cn(
                    key === "female" && "border-t border-edge sm:border-l sm:border-t-0",
                  )}
                >
                  <GenderBanner gender={key} />
                  <div className="p-4">
                    <p className="text-sm text-ink">{LORE_COUPLE[key].name}</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      {LORE_COUPLE[key].title}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2">
              {LORE_CHAPTERS.map((chapter, index) => (
                <article
                  key={chapter.title}
                  className={cn(
                    "space-y-3 border-edge p-6 md:p-8",
                    index > 0 && "border-t",
                    index === 1 && "sm:border-t-0",
                    index % 2 === 1 && "sm:border-l",
                  )}
                >
                  <h2 className="heading text-[11px] text-ink">
                    <span className="text-ink-faint">
                      {(CHAPTER_NUMBERS[index] ?? index + 1) + "."}
                    </span>{" "}
                    {chapter.title}
                  </h2>
                  <p className="text-xs leading-relaxed text-ink-soft">{chapter.text}</p>
                  <NarrationButton
                    playing={narration.current === chapter.voice}
                    onClick={() => narration.toggle(chapter.voice)}
                  />
                </article>
              ))}
            </div>
          </div>
          <CornerAccents />
        </section>

        <section className="space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="heading text-[11px] text-ink">Por dentro do jogo</h2>
            <p className="text-xs text-ink-faint">
              Quatro telas da mesma noite, do jeito que elas aparecem no navegador.
            </p>
          </div>

          <PreviewGallery shots={PREVIEW_SHOTS} />
        </section>

        <section className="space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="heading text-[11px] text-ink">O que a noite pede</h2>
            <p className="text-xs text-ink-faint">
              Tudo roda sozinho enquanto você olha, e nada sobe sem você mandar.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {LORE_PILLARS.map((pillar) => (
              <article
                key={pillar.title}
                className="relative rounded-lg border border-edge bg-surface-high/50 p-4"
              >
                <h3 className="heading text-[11px] text-ink">{pillar.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft">{pillar.text}</p>
                <CornerAccents inside />
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4 text-center">
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-ink-soft">
            Escolha um nome, escolha uma linhagem e desça. A primeira noite é a mais barata que você
            vai ter.
          </p>
          <PlayButton
            href={hasRun ? "/character" : "/login"}
            label={hasRun ? "Voltar para a caçada" : "Jogar grátis"}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
