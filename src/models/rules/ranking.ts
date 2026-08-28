import {
  clampPage as clamp,
  pageCount as count,
  pageOf as slice,
  pageOfPosition as positionPage,
} from "@/shared/utils/pagination";
import type { Hunter, RankingBoard } from "../entities/ranking";

const RANKING_PAGE_SIZE = 12;

export interface RankingEntry {
  position: number;
  hunter: Hunter;
  value: number;
  isPlayer: boolean;
}

export function buildBoard(
  hunters: readonly Hunter[],
  board: RankingBoard,
  playerId: string | null,
): RankingEntry[] {
  return [...hunters]
    .sort((first, second) => {
      const difference = board.value(second) - board.value(first);
      return difference !== 0 ? difference : first.name.localeCompare(second.name, "pt-BR");
    })
    .map((hunter, index) => ({
      position: index + 1,
      hunter,
      value: board.value(hunter),
      isPlayer: hunter.id === playerId,
    }));
}

export function pageCount(total: number, size: number = RANKING_PAGE_SIZE): number {
  return count(total, size);
}

export function clampPage(page: number, total: number, size: number = RANKING_PAGE_SIZE): number {
  return clamp(page, total, size);
}

export function pageOf(
  entries: readonly RankingEntry[],
  page: number,
  size: number = RANKING_PAGE_SIZE,
): RankingEntry[] {
  return slice(entries, page, size);
}

export function pageOfPosition(position: number, size: number = RANKING_PAGE_SIZE): number {
  return positionPage(position, size);
}
