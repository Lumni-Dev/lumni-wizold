"use client";

import { LOG_KIND_LABEL, withinDiary, type LogEntry } from "@/models/entities/log-entry";
import { clampPage, pageCount, pageOf } from "@/shared/utils/pagination";
import { useState } from "react";
import { formatTime } from "@/shared/utils/format";
import { List, ListRow } from "./list";
import { Pagination } from "./pagination";
import { Panel } from "./panel";
import { EmptyState } from "./empty-state";

const PAGE_SIZE = 6;

export function ActivityLog({ entries }: { entries: LogEntry[] }) {
  const [page, setPage] = useState(1);

  const kept = withinDiary(entries);
  const currentPage = clampPage(page, kept.length, PAGE_SIZE);
  const pages = pageCount(kept.length, PAGE_SIZE);
  const visible = pageOf(kept, currentPage, PAGE_SIZE);

  return (
    <Panel
      title="Diário"
      description="Últimas 7 noites, em ordem."
      padding="none"
      footer={pages > 1 ? <Pagination page={currentPage} pages={pages} onChange={setPage} /> : null}
    >
      {visible.length === 0 ? (
        <div className="p-4">
          <EmptyState
            title="Nada registrado"
            description="Treine, cace ou negocie para começar a escrever."
          />
        </div>
      ) : (
        <List>
          {visible.map((entry) => (
            <ListRow key={entry.id} layout="column">
              <p className="text-xs leading-relaxed text-ink-soft">{entry.message}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                {LOG_KIND_LABEL[entry.kind]}
                <span className="font-mono normal-case tracking-normal">
                  {" "}
                  - {formatTime(entry.date)}
                </span>
              </p>
            </ListRow>
          ))}
        </List>
      )}
    </Panel>
  );
}
