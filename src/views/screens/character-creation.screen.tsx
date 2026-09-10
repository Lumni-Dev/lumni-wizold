"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useGame } from "@/controllers/game.context";
import { useT } from "@/controllers/use-locale";
import { validateName } from "@/controllers/character.controller";
import { GENDERS, type Gender } from "@/models/entities/character";
import { GAME_NAME, GAME_TAGLINE, NAME_MAX_LENGTH } from "@/shared/constants/game";
import { sanitizeName } from "@/shared/utils/text";
import { Button } from "../components/button";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { Field } from "../components/field";
import { GenderArtFill } from "../components/gender-icon";
import { RowText } from "../components/list";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
import { Toast } from "../layout/toast";

export function CharacterCreationScreen() {
  const t = useT();
  const { ready, authenticated, character, startRun } = useGame();
  const router = useRouter();

  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (ready && character) router.replace("/character");
    if (ready && !authenticated) router.replace("/");
  }, [ready, authenticated, character, router]);

  function submit(event: FormEvent) {
    event.preventDefault();

    const problem = validateName(name);
    if (problem) {
      setError(problem);
      return;
    }
    if (!gender) {
      setError("Choose Lumni's bloodline or Luna's.");
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
        <p className="heading text-[11px] text-ink-faint">{t("Loading...")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl space-y-6">
        <header className="space-y-2 text-center">
          <p className="font-logo text-lg uppercase tracking-[0.22em] text-highlight">
            {GAME_NAME}
          </p>
          <p className="text-[11px] uppercase tracking-[0.24em] text-ink-faint">
            {t(GAME_TAGLINE)}
          </p>
          <p className="mx-auto max-w-md text-xs leading-relaxed text-ink-soft">
            {t("The mark is already on your skin. Before the first night, say who you are.")}
          </p>
        </header>

        <form onSubmit={submit} className="space-y-6">
          <Panel title="Name">
            <Field
              value={name}
              onChange={(event) => setName(sanitizeName(event.target.value, NAME_MAX_LENGTH))}
              maxLength={NAME_MAX_LENGTH}
              placeholder="What the pack will call you"
              autoComplete="off"
            />
          </Panel>

          <Panel
            title="Bloodline"
            description="The choice sets only the starting lean. Every attribute stays trainable."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {GENDERS.map((definition) => {
                const chosen = gender === definition.key;
                return (
                  <button
                    key={definition.key}
                    type="button"
                    onClick={() => setGender(definition.key)}
                    aria-pressed={chosen}
                    className="h-full text-left"
                  >
                    <Card
                      height="fill"
                      interactive
                      tone={chosen ? "highlighted" : "default"}
                    >
                      <CardHeader art={<GenderArtFill gender={definition.key} />}>
                        <RowText title={definition.label} label={definition.title} />
                      </CardHeader>
                      <CardBody>
                        <p className="text-xs leading-relaxed text-ink-faint">
                          {t(definition.description)}
                        </p>
                      </CardBody>
                      <CardFooter>
                        <Tag tone="neutral">{definition.bonusLabel}</Tag>
                      </CardFooter>
                    </Card>
                  </button>
                );
              })}
            </div>
          </Panel>

          {error ? <p className="text-xs text-ink-soft">{error}</p> : null}

          <Button
            type="submit"
            variant="primary"
            size="medium"
            fullWidth
            busy={creating}
            disabled={!gender || name.trim().length === 0}
          >
            Start the first night
          </Button>
        </form>
      </div>

      <Toast />
    </div>
  );
}
