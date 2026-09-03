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
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between", className)}>
      <span className="text-[11px] text-ink-faint">Página {formatNumber(page)} de {formatNumber(pages)}</span>

      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end">
        {children}
        <Button variant="outline" fullWidth className="sm:w-auto" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Anterior
        </Button>
        <Button variant="outline" fullWidth className="sm:w-auto" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Próxima
        </Button>
      </div>
    </div>
  );
}
