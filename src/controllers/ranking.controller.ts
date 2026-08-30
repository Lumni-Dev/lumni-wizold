import type { Gender } from "@/models/entities/character";
import type { GameState } from "@/models/entities/game-state";
import {
  findBoard,
  RANKING_BOARDS,
  type Hunter,
  type RankingBoard,
  type RankingKey,
} from "@/models/entities/ranking";
import {
  buildBoard,
  clampPage,
  pageCount,
  pageOf,
  pageOfPosition,
  type RankingEntry,
} from "@/models/rules/ranking";
import { findItem } from "@/models/data/items";
import { EQUIPMENT_SLOTS, type EquipmentSlot, type Item } from "@/models/entities/item";
import { enhancementOf } from "@/models/rules/forge";
import { petBonus } from "@/models/rules/pet";
import { deriveStatsOf, type DerivedStats } from "@/models/rules/stats";
import { normalizeText } from "@/shared/utils/text";

export interface RankingView {
  board: RankingBoard;
  entries: RankingEntry[];
  page: number;
  pages: number;
  total: number;
  boardSize: number;
  playerPosition: number | null;
  playerPage: number | null;
}

function playerAsHunter(state: GameState): Hunter | null {
  const character = state.character;
  if (!character) return null;

  return {
    id: character.id,
    name: character.name,
    gender: character.gender,
    level: character.level,
    attributes: character.attributes,
    hunts: character.hunts,
    wins: character.wins,
    losses: character.losses,
    arena: character.arenaWins,
    arenaLosses: character.arenaLosses,
    bronze: character.bronze,
    pet: state.pet
      ? {
          name: state.pet.name,
          gender: state.pet.gender,
          level: state.pet.level ?? 1,
          energy: state.pet.energy,
          active: state.pet.active !== false,
        }
      : null,
    equipment: state.equipment,
    enhancements: state.enhancements ?? {},
    forge: EQUIPMENT_SLOTS.reduce((total, slot) => {
      const itemId = state.equipment[slot];
      return total + (itemId ? enhancementOf(state.enhancements, itemId) : 0);
    }, 0),
    mining: state.mining?.level ?? 1,
  };
}

function huntersOf(
  state: GameState,
  roster: readonly Hunter[],
): { hunters: Hunter[]; playerId: string | null } {
  const player = playerAsHunter(state);
  const others = roster.filter((hunter) => hunter.id !== player?.id);
  return {
    hunters: player ? [...others, player] : [...others],
    playerId: player?.id ?? null,
  };
}

export function listRanking(
  state: GameState,
  roster: readonly Hunter[],
  key: RankingKey,
  page: number,
  search = "",
  gender: Gender | "all" = "all",
): RankingView {
  const board = findBoard(key);
  const { hunters, playerId } = huntersOf(state, roster);

  const entries = buildBoard(hunters, board, playerId);
  const playerEntry = entries.find((entry) => entry.isPlayer) ?? null;

  const term = normalizeText(search);
  const found = entries.filter(
    (entry) =>
      (term ? normalizeText(entry.hunter.name).includes(term) : true) &&
      (gender === "all" || entry.hunter.gender === gender),
  );

  const safePage = clampPage(page, found.length);

  const playerIndex = found.findIndex((entry) => entry.isPlayer);

  return {
    board,
    entries: pageOf(found, safePage),
    page: safePage,
    pages: pageCount(found.length),
    total: found.length,
    boardSize: entries.length,
    playerPosition: playerEntry?.position ?? null,
    playerPage: playerIndex >= 0 ? pageOfPosition(playerIndex + 1) : null,
  };
}

export interface ProfilePosition {
  key: RankingKey;
  label: string;
  position: number;
  value: number;
}

export interface HunterProfile {
  hunter: Hunter;
  isPlayer: boolean;
  positions: ProfilePosition[];
  boardSize: number;
  stats: DerivedStats;
  gear: { slot: EquipmentSlot; item: Item | null; level: number }[];
}

export function profileOf(
  state: GameState,
  roster: readonly Hunter[],
  hunterId: string,
): HunterProfile | null {
  const { hunters, playerId } = huntersOf(state, roster);
  const hunter = hunters.find((candidate) => candidate.id === hunterId);
  if (!hunter) return null;

  const positions = RANKING_BOARDS.map((board) => {
    const entries = buildBoard(hunters, board, playerId);
    const entry = entries.find((candidate) => candidate.hunter.id === hunter.id);

    return {
      key: board.key,
      label: board.label,
      position: entry?.position ?? hunters.length,
      value: board.value(hunter),
    };
  });

  const stats = deriveStatsOf(
    {
      level: hunter.level,
      attributes: hunter.attributes,
      form: "human",
      petAttributes: hunter.id === playerId ? petBonus(state.pet) : undefined,
      enhancements: hunter.enhancements,
    },
    hunter.equipment,
  );

  const gear = EQUIPMENT_SLOTS.map((slot) => {
    const itemId = hunter.equipment[slot];
    return {
      slot,
      item: itemId ? (findItem(itemId) ?? null) : null,
      level: itemId ? enhancementOf(hunter.enhancements, itemId) : 0,
    };
  });

  return {
    hunter,
    isPlayer: hunter.id === playerId,
    positions,
    boardSize: hunters.length,
    stats,
    gear,
  };
}
