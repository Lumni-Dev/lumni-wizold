"use client";

import { useState, type ReactNode } from "react";
import { formatNumber } from "@/shared/utils/format";
import { Button } from "./button";
import { List } from "./list";
import { Panel } from "./panel";

export const WIKI_PAGE_SIZE = 6;

export function WikiPaginatedPanel<T>({
  id,
  title,
  description,
  action,
  header,
  items,
  children,
}: {
  id?: string;
  title: string;
  description: string;
  action?: ReactNode;
  header?: ReactNode;
  items: readonly T[];
  children: (pageItems: readonly T[]) => ReactNode;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / WIKI_PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const slice = items.slice(safePage * WIKI_PAGE_SIZE, (safePage + 1) * WIKI_PAGE_SIZE);

  const paginated = items.length > WIKI_PAGE_SIZE;

  return (
    <div id={id} className="scroll-mt-28">
      <Panel
        title={title}
        description={description}
        action={action}
        padding="none"
        footer={
          paginated ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-ink-faint">
                Página {formatNumber(safePage + 1)} de {formatNumber(totalPages)} ·{" "}
                {formatNumber(items.length)} no total
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={safePage === 0}
                  onClick={() => setPage(safePage - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage(safePage + 1)}
                >
                  Próximo
                </Button>
              </div>
            </div>
          ) : undefined
        }
      >
        {header}
        <List>{children(slice)}</List>
      </Panel>
    </div>
  );
}
