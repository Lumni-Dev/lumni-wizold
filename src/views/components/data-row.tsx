"use client";

import type { ReactNode } from "react";
import { useT } from "@/controllers/use-locale";
import { ListRow } from "./list";

export function DataRow({ label, value }: { label: string; value: ReactNode }) {
  const t = useT();
  return (
    <ListRow className="justify-between">
      <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">{t(label)}</span>
      <span className="font-mono text-sm text-ink">
        {typeof value === "string" ? t(value) : value}
      </span>
    </ListRow>
  );
}
