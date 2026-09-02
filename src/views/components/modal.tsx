"use client";

import { useEffect, type ReactNode } from "react";
import { playSound } from "@/controllers/sound";
import { cn } from "@/shared/utils/class-names";

export function Modal({
  open,
  title,
  onClose,
  action,
  footer,
  children,
  dismissible = true,
  className,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  action?: ReactNode;
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
    if (!open) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !dismissible) return undefined;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
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
          "flex max-h-[calc(100svh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-lg",
          "border border-edge-strong bg-surface shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)]",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-edge bg-surface-high px-4 py-3">
          <h2 className="heading truncate text-[11px] text-ink">{title}</h2>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {action ? (
              <span className="inline-flex h-6 items-center justify-center rounded-md border border-edge px-2 font-mono text-[11px] text-ink-faint">
                {action}
              </span>
            ) : null}
            {dismissible ? (
              <kbd className="hidden h-6 select-none items-center rounded-md border border-edge px-1.5 font-mono text-[10px] tracking-[0.1em] text-ink-faint sm:inline-flex">
                ESC
              </kbd>
            ) : null}
            {dismissible ? (
              <button
                type="button"
                onClick={onClose}
                aria-label={"Fechar " + title}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-edge text-ink-faint transition-colors hover:border-edge-strong hover:text-ink"
              >
                <span aria-hidden="true" className="text-sm leading-none">
                  ×
                </span>
              </button>
            ) : null}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer ? <div className="border-t border-edge p-4">{footer}</div> : null}
      </section>
    </div>
  );
}
