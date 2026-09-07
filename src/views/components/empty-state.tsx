"use client";

import { useT } from "@/controllers/use-locale";

export function EmptyState({ title, description }: { title: string; description?: string }) {
  const t = useT();
  return (
    <div className="flex h-fit flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-edge p-8 text-center">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">{t(title)}</p>
      {description ? <p className="max-w-sm text-xs text-ink-faint">{t(description)}</p> : null}
    </div>
  );
}
