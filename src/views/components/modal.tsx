"use client";

import { useEffect, type ReactNode } from "react";
import { playSound } from "@/controllers/sound";
import { cn } from "@/shared/utils/class-names";

export function Modal({
  open,
  title,
  onClose,
  footer,
  children,
  dismissible = true,
  className,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  dismissible?: boolean;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return undefined;

    playSound("ui");
    return () => playSound("ui");
  }, [open]);

  useEffect(() => {
    if (!open || !dismissible) return undefined;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 p-4 backdrop-blur"
      onClick={dismissible ? onClose : undefined}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-lg",
          "border border-edge-strong bg-surface shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)]",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-edge bg-surface-high/40 px-4 py-3">
          <h2 className="heading truncate text-[11px] text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={"Fechar " + title}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-edge text-ink-faint transition-colors hover:border-edge-strong hover:text-ink"
          >
            <span aria-hidden="true" className="text-sm leading-none">
              ×
            </span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer ? <div className="border-t border-edge p-4">{footer}</div> : null}
      </section>
    </div>
  );
}
