"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { playSound } from "@/controllers/sound";
import { loadBirth, saveBirth } from "@/models/repositories/birth.repository";
import { GAME_NAME, MIN_AGE } from "@/shared/constants/game";
import { GLASS_SECTION } from "@/shared/constants/ui";
import { ageOf, EMPTY_BIRTH, isRealBirth } from "@/shared/utils/birth";
import { cn } from "@/shared/utils/class-names";
import { Button } from "../components/button";
import { CornerAccents } from "../components/corner-accents";
import { Field } from "../components/field";
import { LiveBackdrop } from "../components/live-backdrop";
import { Select, type SelectOption } from "../components/select";

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden className="h-4 w-4 shrink-0">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

interface GoogleIdentity {
  initialize: (config: {
    client_id: string;
    callback: (answer: { credential: string }) => void;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type: "standard";
      theme: "filled_black";
      size: "large";
      text: "continue_with";
      shape: "rect";
      logo_alignment: "left";
      width: number;
      locale: string;
    },
  ) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } };
  }
}

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const two = (value: number) => String(value).padStart(2, "0");
const MONTH_OPTIONS: SelectOption[] = MONTHS.map((name, index) => ({
  value: two(index + 1),
  label: name,
}));
const THIS_YEAR = new Date().getFullYear();
const YEAR_OPTIONS: SelectOption[] = Array.from({ length: 110 }, (_, index) => {
  const year = THIS_YEAR - index;
  return { value: String(year), label: String(year) };
});
function daysInMonth(month: string, year: string): number {
  if (!month) return 31;
  return new Date(Number(year || "2000"), Number(month), 0).getDate();
}
export function LoginScreen() {
  const { ready, character, enter, verifyTwoFactor, resendTwoFactor } = useGame();
  const router = useRouter();
  const [birth, setBirth] = useState(EMPTY_BIRTH);
  const [entering, setEntering] = useState(false);
  const [twoFactor, setTwoFactor] = useState<{ hasCharacter: boolean } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const birthRef = useRef(birth);
  const buttonHost = useRef<HTMLDivElement>(null);
  const age = ageOf(birth);
  const complete = isRealBirth(birth);
  const oldEnough = age !== null && age >= MIN_AGE;
  const dayCount = daysInMonth(birth.month, birth.year);
  const dayOptions: SelectOption[] = Array.from({ length: dayCount }, (_, index) => ({
    value: two(index + 1),
    label: two(index + 1),
  }));
  function setBirthPart(part: Partial<typeof birth>) {
    const next = { ...birth, ...part };
    const limit = daysInMonth(next.month, next.year);
    if (next.day && Number(next.day) > limit) next.day = two(limit);
    setBirth(next);
  }
  useEffect(() => {
    document.body.classList.add("landing-page");
    return () => document.body.classList.remove("landing-page");
  }, []);
  useEffect(() => {
    if (ready && character) router.replace("/character");
  }, [ready, character, router]);
  useEffect(() => {
    const saved = loadBirth();
    if (!saved) return;
    const timer = window.setTimeout(() => setBirth(saved), 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    birthRef.current = birth;
  }, [birth]);
  useEffect(() => {
    if (!oldEnough || !GOOGLE_CLIENT_ID) return;
    let alive = true;
    const arm = () => {
      const host = buttonHost.current;
      const identity = window.google?.accounts?.id;
      if (!alive || !host || !identity) return;
      identity.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (answer) => {
          void (async () => {
            setEntering(true);
            try {
              const opened = await enter(answer.credential, birthRef.current);
              if (!opened) return;
              if (opened.needsTwoFactor) {
                setTwoFactor({ hasCharacter: opened.hasCharacter });
                setTwoFactorCode("");
                return;
              }
              saveBirth(birthRef.current);
              playSound("door");
              router.push(opened.hasCharacter ? "/character" : "/create");
            } finally {
              setEntering(false);
            }
          })();
        },
      });
      host.replaceChildren();
      identity.renderButton(host, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "rect",
        logo_alignment: "left",
        width: Math.min(400, Math.max(200, host.offsetWidth)),
        locale: "pt_BR",
      });
    };
    if (window.google?.accounts?.id) {
      arm();
      return () => {
        alive = false;
      };
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="' + GOOGLE_SCRIPT_SRC + '"]',
    );
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", arm);
    if (!existing) {
      script.src = GOOGLE_SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    return () => {
      alive = false;
      script.removeEventListener("load", arm);
    };
  }, [oldEnough, enter, router]);
  return (
    <div className="relative flex min-h-screen flex-col">
      <LiveBackdrop />
      <main className="relative z-10 flex min-h-screen items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md space-y-6">
          <header className="text-center">
            <Link
              href="/"
              className="mx-auto flex w-fit flex-col items-center gap-4 transition-opacity hover:opacity-90"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon.png"
                alt=""
                aria-hidden
                className="landing-hero-shadow-logo h-14 w-14 shrink-0 rounded-md"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/ui/logo.webp?v=3"
                alt={GAME_NAME}
                className="landing-hero-shadow-logo h-[4.5rem] w-auto shrink-0"
              />
            </Link>
          </header>

          <div
            className={cn(
              "landing-hero-shadow-button relative overflow-hidden rounded-lg border border-edge",
              GLASS_SECTION,
            )}
          >
            <div className="border-b border-edge px-4 py-3">
              <h1 className="landing-hero-shadow-text heading text-[11px] text-ink">
                {twoFactor ? "Verificação" : "Entrar"}
              </h1>
              <p className="landing-hero-shadow-text mt-1 text-xs text-ink-faint">
                {twoFactor
                  ? "Confirme o código enviado ao seu e-mail."
                  : "A noite não cobra nada para começar."}
              </p>
            </div>

            <div className="space-y-4 p-4">
              {twoFactor ? (
                <>
                  <p className="landing-hero-shadow-text text-xs leading-relaxed text-ink-faint">
                    Enviamos um código de oito dígitos para o e-mail da conta. Ele vale por 10
                    minutos.
                  </p>
                <Field
                  label="Código"
                  numeric
                  maxLength={8}
                  value={twoFactorCode}
                  autoComplete="one-time-code"
                  onChange={(event) => setTwoFactorCode(event.target.value.slice(0, 8))}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    size="medium"
                    fullWidth
                    busy={verifying}
                    disabled={!/^\d{8}$/.test(twoFactorCode)}
                    onClick={() => {
                      void (async () => {
                        setVerifying(true);
                        try {
                          const opened = await verifyTwoFactor(twoFactorCode);
                          if (!opened) return;
                          saveBirth(birthRef.current);
                          playSound("door");
                          router.push(opened.hasCharacter ? "/character" : "/create");
                        } finally {
                          setVerifying(false);
                        }
                      })();
                    }}
                  >
                    Confirmar
                  </Button>
                  <Button
                    variant="outline"
                    size="medium"
                    fullWidth
                    onClick={() => resendTwoFactor()}
                  >
                    Reenviar código
                  </Button>
                  <Button
                    variant="ghost"
                    size="medium"
                    fullWidth
                    onClick={() => {
                      setTwoFactor(null);
                      setTwoFactorCode("");
                    }}
                  >
                    Voltar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="landing-hero-shadow-text text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    Data de nascimento
                  </p>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  compact
                  aria-label="Dia"
                  placeholder="Dia"
                  value={birth.day}
                  options={dayOptions}
                  onChange={(day) => setBirthPart({ day })}
                />
                <Select
                  compact
                  aria-label="Mês"
                  placeholder="Mês"
                  value={birth.month}
                  options={MONTH_OPTIONS}
                  onChange={(month) => setBirthPart({ month })}
                />
                <Select
                  compact
                  aria-label="Ano"
                  placeholder="Ano"
                  value={birth.year}
                  options={YEAR_OPTIONS}
                  onChange={(year) => setBirthPart({ year })}
                />
              </div>
                  <p className="landing-hero-shadow-text text-[11px] leading-relaxed text-ink-faint">
                    {complete && !oldEnough
                      ? "A caçada é para maiores de " + MIN_AGE + " anos."
                      : "O jogo é para maiores de " +
                        MIN_AGE +
                        " anos: tem sangue na caça, duelo entre jogadores, mesa de conversa aberta e compra com dinheiro de verdade."}
                  </p>
                </div>

                {oldEnough && GOOGLE_CLIENT_ID ? (
                  <div className="group relative">
                    <Button
                      variant="primary"
                      size="medium"
                      fullWidth
                      busy={entering}
                      aria-hidden
                      tabIndex={-1}
                      className="landing-hero-shadow-button pointer-events-none group-hover:brightness-110"
                    >
                      <GoogleMark />
                      Entrar com Google
                    </Button>
                    <div
                      ref={buttonHost}
                      className={cn(
                        "absolute inset-0 flex items-center justify-center overflow-hidden opacity-0",
                        entering && "pointer-events-none",
                      )}
                    />
                  </div>
                ) : (
                  <Button variant="primary" size="medium" fullWidth disabled>
                    <GoogleMark />
                    Entrar com Google
                  </Button>
                )}

                <p className="landing-hero-shadow-text text-xs leading-relaxed text-ink-faint">
                  A porta é a conta Google: nada de senha nova para lembrar. Na primeira entrada a
                  data de nascimento fica guardada, e nas seguintes basta o botão.
                </p>
              </>
            )}
            </div>
            <CornerAccents inside />
          </div>

          <div className="flex items-center justify-center">
            <Link
              href="/"
              className="landing-hero-shadow-text text-[11px] uppercase tracking-[0.16em] text-ink-faint transition-colors hover:text-ink"
            >
              Voltar para a lenda
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
