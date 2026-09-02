import { EQUIPMENT_SETS } from "@/models/data/equipment-sets";
import type { Gender } from "@/models/entities/character";
import { GENDERS } from "@/models/entities/character";
import type { Item } from "@/models/entities/item";
import {
  CATEGORY_PLURAL,
  EQUIPMENT_SET_KEYS,
  EQUIPMENT_SLOTS,
  ITEM_CATEGORIES,
  POTION_SIZES,
  SET_LABEL,
  SIZE_LABEL,
  SLOT_LABEL,
  type EquipmentSet,
  type ItemCategory,
  type PotionSize,
} from "@/models/entities/item";
import { RANKING_BOARDS, type RankingKey } from "@/models/entities/ranking";

export type FilterOption<K extends string = string> = { key: K; label: string };

export type CategoryFilter = ItemCategory | "all";
export type SetFilter = EquipmentSet | "all";
export type SizeFilter = PotionSize | "all";

export function inventoryCategoryFilterOptions(): FilterOption<CategoryFilter>[] {
  return [
    { key: "all", label: "Tudo" },
    ...ITEM_CATEGORIES.map((category) => ({
      key: category,
      label: CATEGORY_PLURAL[category],
    })),
  ];
}

export function marketCategoryFilterOptions(opts?: {
  includeMaterial?: boolean;
}): FilterOption<CategoryFilter>[] {
  return [
    { key: "all", label: "Tudo" },
    ...ITEM_CATEGORIES.filter(
      (category) => opts?.includeMaterial === true || category !== "material",
    ).map((category) => ({
      key: category,
      label: CATEGORY_PLURAL[category],
    })),
  ];
}

export function slotCategoryFilterOptions(opts?: {
  includeMaterial?: boolean;
}): FilterOption<CategoryFilter>[] {
  const entries: FilterOption<CategoryFilter>[] = [
    { key: "all", label: "Tudo" },
  ];
  if (opts?.includeMaterial) {
    entries.push({ key: "material", label: CATEGORY_PLURAL.material });
  }
  return [
    ...entries,
    ...EQUIPMENT_SLOTS.map((slot) => ({ key: slot, label: SLOT_LABEL[slot] })),
  ];
}

export function setFilterOptions(opts?: { marketOnly?: boolean }): FilterOption<SetFilter>[] {
  const keys = opts?.marketOnly
    ? EQUIPMENT_SET_KEYS.filter((key) =>
        EQUIPMENT_SETS.some((definition) => definition.key === key && definition.inMarket),
      )
    : EQUIPMENT_SET_KEYS;
  return [{ key: "all", label: "Todos" }, ...keys.map((key) => ({ key, label: SET_LABEL[key] }))];
}

export function potionSizeFilterOptions(): FilterOption<SizeFilter>[] {
  return [
    { key: "all", label: "Todas" },
    ...POTION_SIZES.map((key) => ({ key, label: SIZE_LABEL[key] })),
  ];
}

export function genderFilterOptions(): FilterOption<Gender | "all">[] {
  return [{ key: "all", label: "Todos" }, ...GENDERS.map((entry) => ({ key: entry.key, label: entry.label }))];
}

export function rankingBoardFilterOptions(): FilterOption<RankingKey>[] {
  return RANKING_BOARDS.map((board) => ({ key: board.key, label: board.label }));
}

export function matchesMarketItemFilter(
  item: Item,
  category: CategoryFilter,
  set: SetFilter,
  size: SizeFilter,
): boolean {
  if (category !== "all" && item.category !== category) return false;
  if (item.category === "pet") return true;
  if (item.category === "potion") return size === "all" || item.size === size;
  return set === "all" || item.set === set;
}

export function matchesCategoryAndSet(
  item: Item,
  category: CategoryFilter,
  set: SetFilter,
): boolean {
  if (category !== "all" && item.category !== category) return false;
  return set === "all" || item.set === set;
}
