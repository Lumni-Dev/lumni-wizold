import { COMPANY } from "@/shared/constants/company";
import { GAME_NAME, GAME_TAGLINE } from "@/shared/constants/game";
import { ActionIcon } from "../components/app-icon";
import { BackToTop } from "./back-to-top";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-edge bg-surface/40">
      <div className="mx-auto w-full max-w-5xl p-4 md:px-8 md:py-8">
        <div className="max-w-md space-y-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt={GAME_NAME} className="h-8 w-8 shrink-0 rounded-md" />
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              {GAME_TAGLINE}
            </p>
          </div>
          <p className="text-[11px] leading-relaxed text-ink-faint">
            Um jogo da{" "}
            <a
              href={COMPANY.site}
              target="_blank"
              rel="noreferrer"
              className="text-ink-soft transition-colors hover:text-ink"
            >
              {COMPANY.name}
            </a>
            . {COMPANY.description}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-6 border-t border-edge pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] text-ink-faint">
              {COMPANY.legalName} - CNPJ {COMPANY.taxId}
            </p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              © {year} {COMPANY.name}. Todos os direitos reservados.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 sm:items-end">
            <nav aria-label="Contato da Lumni" className="space-y-3 sm:text-right">
              <h2 className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">Contato</h2>
              <ul className="space-y-2">
                {COMPANY.channels.map((channel) => (
                  <li key={channel.kind}>
                    <a
                      href={channel.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center gap-2 text-[11px] text-ink-soft transition-colors hover:text-ink sm:flex-row-reverse"
                    >
                      <ActionIcon
                        action={channel.kind}
                        className="text-ink-faint transition-colors group-hover:text-ink"
                      />
                      {channel.value}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Legal" className="flex flex-wrap items-center gap-4 sm:justify-end">
              <a
                href={COMPANY.privacyUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-ink-soft transition-colors hover:text-ink"
              >
                Privacidade
              </a>
              <a
                href={COMPANY.termsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-ink-soft transition-colors hover:text-ink"
              >
                Termos
              </a>
              <BackToTop />
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
