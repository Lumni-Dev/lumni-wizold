"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/controllers/game.context";
import { useLocale, useT } from "@/controllers/use-locale";
import { sessionHint } from "@/models/repositories/session-hint.repository";
import { lorePack } from "@/models/data/lore.i18n";
import { PREVIEW_SHOTS } from "@/models/data/preview";
import { GAME_NAME, GAME_TAGLINE } from "@/shared/constants/game";
import { BRAND_LOGO_WEBP_PATH } from "@/shared/constants/site";
import { GLASS_SECTION, GLASS_SECTION_STRONG } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { ArtImage } from "../components/art-image";
import { CornerAccents } from "../components/corner-accents";
import { PetLandingBanner } from "../components/pet-icon";
import { CreatureCarousel } from "../components/creature-carousel";
import { PreviewGallery } from "../components/preview-gallery";
import { LiveBackdrop } from "../components/live-backdrop";
import { LandingMusic } from "../components/game-music";
import { useNarration } from "@/controllers/use-narration";
import { LandingCtaButton } from "../components/landing-cta-button";
import { LanguageSwitch } from "../components/language-switch";
import { Footer } from "../layout/footer";
import { NarrationButton } from "../components/narration-button";
import { Spinner } from "../components/spinner";

const CHAPTER_NUMBERS = ["I", "II", "III", "IV"];

export function LandingScreen() {
  const { ready, authenticated, character } = useGame();
  const router = useRouter();
  const hasRun = ready && character !== null;
  const narration = useNarration();
  const t = useT();
  const locale = useLocale();
  const lore = lorePack(locale);
  const maybeLoggedIn = useSyncExternalStore(
    sessionHint.subscribe,
    sessionHint.snapshot,
    sessionHint.serverSnapshot,
  );

  useEffect(() => {
    if (!ready || !authenticated) return;
    router.replace(character ? "/character" : "/create");
  }, [ready, authenticated, character, router]);

  useEffect(() => {
    document.body.classList.add("landing-page");
    return () => document.body.classList.remove("landing-page");
  }, []);

  if (ready ? authenticated : maybeLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-ink-faint">
        <Spinner size="medium" />
        <p className="heading text-[11px]">{t("Loading...")}</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <LiveBackdrop />
      <LandingMusic />
      <div className="absolute right-4 top-4 z-20">
        <LanguageSwitch />
      </div>
      <header className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="space-y-5">
            <h1 className="absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]">
              {GAME_NAME}: {t(GAME_TAGLINE)}
            </h1>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_LOGO_WEBP_PATH}
              alt={GAME_NAME}
              className="landing-hero-shadow-logo mx-auto w-72 max-w-full md:w-96"
            />
            <p className="landing-hero-shadow-text text-[11px] uppercase leading-relaxed tracking-[0.24em] text-ink-faint">
              {t(GAME_TAGLINE)}
            </p>
          </div>

          <p className="landing-hero-shadow-text mx-auto max-w-xl text-sm leading-7 text-ink-soft">
            {t(
              "Two met on a full-moon night and came down the ridge as something else. The pack they started still hunts, and the moon that sets the price of every night is the one in the sky right now, outside.",
            )}
          </p>

          <div className="flex flex-col items-center gap-4">
            {hasRun ? (
              <LandingCtaButton href="/character" label={"Continue as " + character.name} />
            ) : (
              <LandingCtaButton href="/login" label={t("Play free")} />
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl space-y-16 px-4 py-16 md:px-8 md:py-24">
        <section className="relative">
          <div className={cn("rounded-lg border border-edge", GLASS_SECTION)}>
            <div className="border-b border-edge">
              <div className="aspect-video w-full overflow-hidden">
                <ArtImage source="/assets/landing/lumni-luna.webp?v=1" fit="cover" />
              </div>
              <div className="grid grid-cols-1 border-t border-edge sm:grid-cols-2">
                {(["male", "female"] as const).map((key) => (
                  <div
                    key={key}
                    className={cn(
                      "p-4",
                      key === "female" && "border-t border-edge sm:border-l sm:border-t-0",
                    )}
                  >
                    <p className="text-sm text-ink">{lore.couple[key].name}</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      {lore.couple[key].title}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2">
              {lore.chapters.map((chapter, index) => (
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
                    loading={narration.loading === chapter.voice}
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
            <h2 className="heading text-[11px] text-ink">{t("What waits out there")}</h2>
            <p className="text-xs text-ink-faint">
              {t(
                "A hundred creatures across ten areas, from the field's first prey to what dwells in the abyss.",
              )}
            </p>
          </div>

          <CreatureCarousel />
        </section>

        <section className="space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="heading text-[11px] text-ink">{t("The wolf that walks along")}</h2>
            <p className="text-xs text-ink-faint">
              {t("No one hunts alone. Two bloodlines reached the pack, each in its own way.")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {lore.companions.map((companion) => (
              <div key={companion.gender} className="relative">
                <article className={cn("rounded-lg border border-edge", GLASS_SECTION)}>
                  <PetLandingBanner gender={companion.gender} />
                  <div className="space-y-3 p-6 md:p-8">
                    <h3 className="heading text-[11px] text-ink">{companion.title}</h3>
                    <p className="text-xs leading-relaxed text-ink-soft">{companion.text}</p>
                    <NarrationButton
                      playing={narration.current === companion.voice}
                      loading={narration.loading === companion.voice}
                      onClick={() => narration.toggle(companion.voice)}
                    />
                  </div>
                </article>
                <CornerAccents />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="heading text-[11px] text-ink">{t("Inside the game")}</h2>
            <p className="text-xs text-ink-faint">
              {t("Seven screens of the same night, the way they appear in the browser.")}
            </p>
          </div>

          <PreviewGallery shots={PREVIEW_SHOTS} />
        </section>

        <section className="space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="heading text-[11px] text-ink">{t("What the night asks")}</h2>
            <p className="text-xs text-ink-faint">
              {t("Everything runs on its own while you watch, and nothing rises unless you say so.")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {lore.pillars.map((pillar) => (
              <article
                key={pillar.title}
                className={cn("relative rounded-lg border border-edge p-4", GLASS_SECTION_STRONG)}
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
            {t(
              "Choose a name, choose a bloodline and descend. The first night is the cheapest you will ever have.",
            )}
          </p>
          <LandingCtaButton
            href={hasRun ? "/character" : "/login"}
            label={hasRun ? t("Back to the hunt") : t("Play free")}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
