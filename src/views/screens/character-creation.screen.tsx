"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useGame } from "@/controllers/game.context";
import { validateName } from "@/controllers/character.controller";
import { GENDERS, type Gender } from "@/models/entities/character";
import { GAME_NAME, GAME_TAGLINE, NAME_MAX_LENGTH } from "@/shared/constants/game";
import { sanitizeName } from "@/shared/utils/text";
import { cn } from "@/shared/utils/class-names";
import { Button } from "../components/button";
import { CornerAccents } from "../components/corner-accents";
import { GenderIcon } from "../components/gender-icon";
import { Tag } from "../components/tag";
import { Toast } from "../layout/toast";

export function CharacterCreationScreen() {
  const { ready, authenticated, character, startRun } = useGame();
  const router = useRouter();

  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (ready && character) router.replace("/character");
    if (ready && !authenticated) router.replace("/login");
  }, [ready, authenticated, character, router]);

  function submit(event: FormEvent) {
    event.preventDefault();

    const problem = validateName(name);
    if (problem) {
      setError(problem);
      return;
    }
    if (!gender) {
      setError("Escolha a linhagem de Lumni ou a de Luna.");
      return;
    }

    setError(null);
    setCreating(true);
    void startRun(name, gender).then((ok) => {
      if (ok) {
        router.push("/character");
        return;
      }
      setCreating(false);
    });
  }

  if (!ready || character) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="heading text-[11px] text-ink-faint">Abrindo a noite...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl">
        <header className="mb-6 space-y-2 text-center">
          <p className="font-logo text-lg uppercase tracking-[0.22em] text-highlight">
            {GAME_NAME}
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-ink-faint">
            {GAME_TAGLINE}
          </p>
          <p className="mx-auto max-w-md text-xs leading-relaxed text-ink-soft">
            A marca já está na sua pele. Antes da primeira noite, diga quem você é.
          </p>
        </header>

        <form
          onSubmit={submit}
          className="relative h-fit space-y-6 rounded-lg border border-edge bg-surface/80 p-4 md:p-8"
        >
          <fieldset className="space-y-2">
            <legend className="heading text-[11px] text-ink">Nome</legend>
            <input
              value={name}
              onChange={(event) => setName(sanitizeName(event.target.value, NAME_MAX_LENGTH))}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Como a matilha vai te chamar"
              autoComplete="off"
              className="w-full rounded-md border border-edge bg-base px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-edge-strong focus:outline-none"
            />
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="heading text-[11px] text-ink">Linhagem</legend>
            <div className="grid items-start gap-3 sm:grid-cols-2">
              {GENDERS.map((definition) => {
                const chosen = gender === definition.key;
                return (
                  <button
                    key={definition.key}
                    type="button"
                    onClick={() => setGender(definition.key)}
                    aria-pressed={chosen}
                    className={cn(
                      "flex h-fit flex-col gap-3 rounded-md border p-4 text-left transition-colors",
                      chosen
                        ? "border-ink-faint bg-surface-high"
                        : "border-edge bg-surface-high/40 hover:border-edge-strong",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <GenderIcon gender={definition.key} size="large" />
                      <div>
                        <p className="text-sm text-ink">{definition.label}</p>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                          {definition.title}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-ink-faint">
                      {definition.description}
                    </p>
                    <Tag tone="neutral">{definition.bonusLabel}</Tag>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-ink-faint">
              A escolha define apenas a inclinação inicial. Todos os atributos continuam treináveis.
            </p>
          </fieldset>

          {error ? <p className="text-xs text-ink-soft">{error}</p> : null}

          <Button
            type="submit"
            variant="primary"
            size="medium"
            fullWidth
            busy={creating}
            disabled={!gender || name.trim().length === 0}
          >
            Começar a primeira noite
          </Button>
          <CornerAccents />
        </form>
      </div>

      <Toast />
    </div>
  );
}
