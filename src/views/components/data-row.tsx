import type { ReactNode } from "react";
import { ListRow } from "./list";

export function DataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <ListRow className="justify-between">
      <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">{label}</span>
      <span className="font-mono text-sm text-ink">{value}</span>
    </ListRow>
  );
}
