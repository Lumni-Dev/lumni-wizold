import { capBronze, formatReais, formatBronze } from "@/shared/utils/format";
import { findPack, STORE_PACKS, type StorePack } from "@/models/data/store-packs";
import type { GameState } from "@/models/entities/game-state";
import { failure, success, type Result } from "@/models/entities/result";
import { packBronze, bronzePerReal } from "@/models/rules/store";
import { addLog } from "./log.controller";
import { updateCharacter } from "./character.controller";

export interface StoreOffer {
  pack: StorePack;
  bronze: number;
  perReal: number;
}

export function listPacks(state: GameState): StoreOffer[] {
  const level = state.character?.level ?? 1;

  return STORE_PACKS.map((pack) => ({
    pack,
    bronze: packBronze(pack, level),
    perReal: bronzePerReal(pack, level),
  }));
}

export function purchasePack(state: GameState, packId: string): Result<StoreOffer> {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const pack = findPack(packId);
  if (!pack) return failure(state, "Esse pacote não existe mais.");

  const bronze = packBronze(pack, character.level);
  const next = updateCharacter(state, (current) => ({
    ...current,
    bronze: capBronze(current.bronze + bronze),
  }));

  const message =
    pack.name +
    " creditado: " +
    formatBronze(bronze) +
    " por " +
    formatReais(pack.priceCents) +
    ".";

  return success(addLog(next, "character", message), message, {
    pack,
    bronze,
    perReal: bronzePerReal(pack, character.level),
  });
}
