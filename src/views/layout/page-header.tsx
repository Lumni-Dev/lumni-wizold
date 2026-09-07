"use client";

import type { ReactNode } from "react";
import { useT } from "@/controllers/use-locale";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-edge pb-4">
      <div>
        <h1 className="heading text-lg text-highlight">{t(title)}</h1>
        <p className="mt-2 max-w-xl text-xs leading-relaxed text-ink-faint">{t(description)}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
