"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { LORE_CHAPTERS, LORE_COMPANIONS, LORE_COUPLE, LORE_PILLARS } from "@/models/data/lore";
import { PREVIEW_SHOTS } from "@/models/data/preview";
import { GAME_NAME, GAME_TAGLINE } from "@/shared/constants/game";
import { cn } from "@/shared/utils/class-names";
import { ActionIcon } from "../components/app-icon";
import { Button } from "../components/button";
import { CornerAccents } from "../components/corner-accents";
import { GenderBanner } from "../components/gender-icon";
import { CreatureCarousel } from "../components/creature-carousel";
import { PetPortrait } from "../components/pet-icon";
import { PreviewGallery } from "../components/preview-gallery";
import { LiveBackdrop } from "../components/live-backdrop";
import { LandingCtaButton } from "../components/landing-cta-button";
import { Footer } from "../layout/footer";

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
    <Button
      variant="ghost"
      className="shrink-0"
      onClick={onClick}
      aria-label={playing ? "Parar a narração" : "Ouvir este capítulo"}
    >
      <ActionIcon action={playing ? "pause" : "play"} />
      {playing ? "Parar" : "Ouvir"}
    </Button>
  );
}

export function LandingScreen() {
  const { ready, character } = useGame();
  const hasRun = ready && character !== null;
  const narration = useNarration();

  useEffect(() => {
    document.body.classList.add("landing-page");
    return () => document.body.classList.remove("landing-page");
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col">
      <LiveBackdrop />
      <header className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="space-y-5">
            <h1 className="absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]">
              {GAME_NAME}: {GAME_TAGLINE}
            </h1>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/ui/logo.webp?v=3"
              alt={GAME_NAME}
              className="landing-hero-shadow-logo mx-auto w-72 max-w-full md:w-96"
            />
            <p className="landing-hero-shadow-text text-[11px] uppercase leading-relaxed tracking-[0.24em] text-ink-faint">
              {GAME_TAGLINE}
            </p>
          </div>

          <p className="landing-hero-shadow-text mx-auto max-w-xl text-sm leading-7 text-ink-soft">
            Dois se encontraram numa noite de lua cheia e desceram a serra sendo outra coisa. A
            matilha que eles começaram ainda caça, e a lua que decide o preço de cada noite é a que
            está no céu agora, lá fora.
          </p>

          <div className="flex flex-col items-center gap-4">
            {hasRun ? (
              <LandingCtaButton href="/character" label={"Continuar com " + character.name} />
            ) : (
              <LandingCtaButton href="/login" label="Jogar grátis" />
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl space-y-16 px-4 py-16 md:px-8 md:py-24">
        <section className="relative">
          <div className="overflow-hidden rounded-lg border border-edge bg-surface/80">
            <div className="grid grid-cols-1 border-b border-edge sm:grid-cols-2">
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

            <div className="grid grid-cols-1 sm:grid-cols-2">
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
            <h2 className="heading text-[11px] text-ink">O lobo que anda junto</h2>
            <p className="text-xs text-ink-faint">
              Ninguém caça sozinho. Duas linhagens chegaram à matilha, cada uma do seu jeito.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {LORE_COMPANIONS.map((companion) => (
              <article
                key={companion.gender}
                className="space-y-4 rounded-lg border border-edge bg-surface/80 p-6 md:p-8"
              >
                <div className="mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-md border border-edge">
                  <PetPortrait gender={companion.gender} />
                </div>
                <h3 className="heading text-[11px] text-ink">{companion.title}</h3>
                <p className="text-xs leading-relaxed text-ink-soft">{companion.text}</p>
                <NarrationButton
                  playing={narration.current === companion.voice}
                  onClick={() => narration.toggle(companion.voice)}
                />
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="heading text-[11px] text-ink">O que espera lá fora</h2>
            <p className="text-xs text-ink-faint">
              Cem criaturas divididas em dez áreas, da primeira presa do campo ao que mora no
              abismo.
            </p>
          </div>

          <CreatureCarousel />
        </section>

        <section className="space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="heading text-[11px] text-ink">Por dentro do jogo</h2>
            <p className="text-xs text-ink-faint">
              Seis telas da mesma noite, do jeito que elas aparecem no navegador.
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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          <p className="landing-hero-shadow-text mx-auto max-w-lg text-sm leading-relaxed text-ink-soft">
            Escolha um nome, escolha uma linhagem e desça. A primeira noite é a mais barata que você
            vai ter.
          </p>
          <LandingCtaButton
            href={hasRun ? "/character" : "/login"}
            label={hasRun ? "Voltar para a caçada" : "Jogar grátis"}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
