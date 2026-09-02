"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/controllers/api.client";
import { useGame } from "@/controllers/game.context";
import { listRanking } from "@/controllers/ranking.controller";
import type { Gender } from "@/models/entities/character";
import { type Hunter, type RankingKey } from "@/models/entities/ranking";
import {
  genderFilterOptions,
  rankingBoardFilterOptions,
} from "../presenters/item-filter.presenter";
import { formatNumber } from "@/shared/utils/format";
import { cn } from "@/shared/utils/class-names";
import { Chip } from "../components/chip";
import { FilterRow, FilterSelect } from "../components/filter-select";
import { HunterSearchField } from "../components/hunter-search-field";
import { CopyNick } from "../components/copy-nick";
import { List, ListRow } from "../components/list";
import { EmptyState } from "../components/empty-state";
import { Pagination } from "../components/pagination";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
import { PageHeader } from "../layout/page-header";

export function RankingScreen() {
  const { state, character } = useGame();
  const [key, setKey] = useState<RankingKey>("level");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<Gender | "all">("all");
  const [roster, setRoster] = useState<Hunter[]>([]);

  useEffect(() => {
    let alive = true;
    void api<{ hunters: Hunter[] }>("GET", "/api/roster").then((answer) => {
      if (alive && answer.ok && answer.data) setRoster(answer.data.hunters);
    });
    return () => {
      alive = false;
    };
  }, []);

  const view = useMemo(
    () => listRanking(state, roster, key, page, search, gender),
    [state, roster, key, page, search, gender],
  );

  if (!character) return null;

  const openBoard = (next: RankingKey) => {
    setKey(next);
    setPage(1);
  };

  const find = (term: string) => {
    setSearch(term);
    setPage(1);
  };

  const cutGender = (next: Gender | "all") => {
    setGender(next);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Ranking"
        description="Onde você está entre os caçadores que a lua conhece."
        action={
          view.playerPosition ? (
            <Tag tone="neutral">
              {view.board.label} - {formatNumber(view.playerPosition)}º de{" "}
              {formatNumber(view.boardSize)}
            </Tag>
          ) : null
        }
      />

      <FilterRow>
        <FilterSelect
          accent
          label="Quadro"
          value={view.board.key}
          options={rankingBoardFilterOptions()}
          onChange={openBoard}
        />
        <FilterSelect
          accent
          label="Personagem"
          value={gender}
          options={genderFilterOptions()}
          onChange={cutGender}
        />
      </FilterRow>

      <HunterSearchField accent value={search} onChange={find} />

      <Panel
        title={view.board.label}
        description={
          search
            ? formatNumber(view.total) +
              " de " +
              formatNumber(view.boardSize) +
              " caçadores com esse nome."
            : view.board.description
        }
        padding="none"
        footer={
          view.pages > 1 ? (
            <Pagination page={view.page} pages={view.pages} onChange={setPage}>
              {view.playerPage && view.playerPage !== view.page ? (
                <Chip onClick={() => setPage(view.playerPage ?? 1)}>Minha posição</Chip>
              ) : null}
            </Pagination>
          ) : undefined
        }
      >
        {view.entries.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Ninguém com esse nome"
              description="A matilha é grande, mas não tanto. Tente outro pedaço do nome."
            />
          </div>
        ) : (
          <List>
            {view.entries.map((entry) => (
              <ListRow
                key={entry.hunter.id}
                className={cn("justify-between", entry.isPlayer && "bg-surface-high")}
              >
                <span className="w-10 shrink-0 font-mono text-[11px] text-ink-faint">
                  {formatNumber(entry.position)}º
                </span>
                <CopyNick name={entry.hunter.name} />
                <Link
                  href={entry.isPlayer ? "/character" : "/ranking/" + entry.hunter.id}
                  className={cn(
                    "min-w-0 flex-1 truncate text-sm transition-colors hover:text-highlight",
                    entry.isPlayer ? "text-highlight" : "text-ink",
                  )}
                >
                  {entry.hunter.name}
                </Link>
                <span className="hidden shrink-0 text-[10px] uppercase tracking-[0.16em] text-ink-faint sm:block">
                  {entry.hunter.gender === "male" ? "Lumni" : "Luna"}
                </span>
                {view.board.key === "level" ? null : (
                  <span className="hidden shrink-0 text-[10px] uppercase tracking-[0.16em] text-ink-faint sm:block">
                    NV. {formatNumber(entry.hunter.level)}
                  </span>
                )}
                <span className="w-20 shrink-0 text-right font-mono text-sm text-ink">
                  {formatNumber(entry.value)}
                </span>
              </ListRow>
            ))}
          </List>
        )}
      </Panel>
    </>
  );
}
