import type { ReactNode } from "react";
import { cn } from "@/shared/utils/class-names";
import { formatNumber } from "@/shared/utils/format";
import { Button } from "./button";

export function Pagination({
  page,
  pages,
  onChange,
  children,
  className,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  children?: ReactNode;
  className?: string;
}) {
  if (pages <= 1) return null;

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <span className="text-[11px] text-ink-faint">
        Página {formatNumber(page)} de {formatNumber(pages)}
      </span>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {children}
        <Button variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Anterior
        </Button>
        <Button variant="outline" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Próxima
        </Button>
      </div>
    </div>
  );
}
