import type { ReactNode } from "react";
import { cn } from "@/shared/utils/class-names";

type TagTone = "neutral" | "light" | "faint";

const TONES: Record<TagTone, string> = {
  neutral: "border-edge-strong bg-surface-high text-ink-soft",
  light: "border-edge-strong bg-surface-top text-ink",
  faint: "border-edge bg-transparent text-ink-faint",
};

export function Tag({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: TagTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md border px-2 text-[10px] uppercase tracking-[0.16em]",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
