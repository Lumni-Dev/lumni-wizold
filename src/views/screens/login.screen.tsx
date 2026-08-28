"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { playSound } from "@/controllers/sound";
import { GAME_NAME, GAME_TAGLINE, MIN_AGE } from "@/shared/constants/game";
import { ageOf, digitsOnly, EMPTY_BIRTH, isRealBirth } from "@/shared/utils/birth";
import { Button } from "../components/button";
import { CornerAccents } from "../components/corner-accents";
import { Field } from "../components/field";

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen() {
  const { ready, character, enter } = useGame();
  const router = useRouter();
  const [birth, setBirth] = useState(EMPTY_BIRTH);
  const [email, setEmail] = useState("");
  const [entering, setEntering] = useState(false);

  const age = ageOf(birth);
  const complete = isRealBirth(birth);
  const oldEnough = age !== null && age >= MIN_AGE;
  const emailFine = EMAIL_SHAPE.test(email.trim());

  useEffect(() => {
    if (ready && character) router.replace("/character");
  }, [ready, character, router]);

  async function submit() {
    if (entering) return;
    setEntering(true);
    const answer = await enter(email.trim(), birth);
    setEntering(false);
    if (!answer) return;

    playSound("door");
    router.push(answer.hasCharacter ? "/character" : "/create");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-6">
        <header className="space-y-2 text-center">
          <Link
            href="/"
            className="font-logo text-lg uppercase tracking-[0.22em] text-highlight transition-colors hover:text-ink"
          >
            {GAME_NAME}
          </Link>
          <p className="text-[11px] uppercase tracking-[0.24em] text-ink-faint">{GAME_TAGLINE}</p>
        </header>

        <div className="relative rounded-lg border border-edge bg-surface/80">
          <div className="border-b border-edge px-4 py-3">
            <h1 className="heading text-[11px] text-ink">Entrar</h1>
            <p className="mt-1 text-xs text-ink-faint">A noite não cobra nada para começar.</p>
          </div>

          <div className="space-y-4 p-4">
            <Field
              compact
              label="E-mail"
              placeholder="voce@exemplo.com"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                Data de nascimento
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Field
                  compact
                  aria-label="Dia"
                  placeholder="Dia"
                  inputMode="numeric"
                  autoComplete="off"
                  value={birth.day}
                  onChange={(event) =>
                    setBirth({ ...birth, day: digitsOnly(event.target.value, 2) })
                  }
                />
                <Field
                  compact
                  aria-label="Mês"
                  placeholder="Mês"
                  inputMode="numeric"
                  autoComplete="off"
                  value={birth.month}
                  onChange={(event) =>
                    setBirth({ ...birth, month: digitsOnly(event.target.value, 2) })
                  }
                />
                <Field
                  compact
                  aria-label="Ano"
                  placeholder="Ano"
                  inputMode="numeric"
                  autoComplete="off"
                  value={birth.year}
                  onChange={(event) =>
                    setBirth({ ...birth, year: digitsOnly(event.target.value, 4) })
                  }
                />
              </div>
              <p className="text-[11px] leading-relaxed text-ink-faint">
                {complete && !oldEnough
                  ? "A caçada é para maiores de " + MIN_AGE + " anos."
                  : "O jogo é para maiores de " +
                    MIN_AGE +
                    " anos: tem sangue na caça, duelo entre jogadores, mesa de conversa aberta e compra com dinheiro de verdade."}
              </p>
            </div>

            <Button
              variant="primary"
              size="medium"
              fullWidth
              disabled={!oldEnough || !emailFine || entering}
              onClick={() => void submit()}
            >
              {entering ? "Abrindo a noite..." : "Entrar com Google"}
            </Button>

            <p className="text-xs leading-relaxed text-ink-faint">
              O login por e-mail é a demonstração do botão do Google: a conta e a partida já vivem
              no servidor, e quando o login de verdade entrar, ele assume esta mesma porta.
            </p>
          </div>
          <CornerAccents />
        </div>

        <div className="flex items-center justify-center">
          <Link
            href="/"
            className="text-[11px] uppercase tracking-[0.16em] text-ink-faint transition-colors hover:text-ink"
          >
            Voltar para a lenda
          </Link>
        </div>
      </div>
    </main>
  );
}
