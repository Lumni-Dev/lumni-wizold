"use client";

import {
  marketCategoryFilterOptions,
  potionSizeFilterOptions,
  setFilterOptions,
  type CategoryFilter,
  type SetFilter,
  type SizeFilter,
} from "../presenters/item-filter.presenter";
import { FilterRow, FilterSelect } from "./filter-select";

interface ItemFilterRowProps {
  category: CategoryFilter;
  set: SetFilter;
  size: SizeFilter;
  onCategoryChange: (value: CategoryFilter) => void;
  onSetChange: (value: SetFilter) => void;
  onSizeChange: (value: SizeFilter) => void;
}

export function ItemFilterRow({
  category,
  set,
  size,
  onCategoryChange,
  onSetChange,
  onSizeChange,
}: ItemFilterRowProps) {
  const isPotion = category === "potion";
  const isPet = category === "pet";

  return (
    <FilterRow>
      <FilterSelect
        label="Categoria"
        value={category}
        options={marketCategoryFilterOptions()}
        onChange={onCategoryChange}
      />
      {isPet ? null : isPotion ? (
        <FilterSelect
          label="Tamanho"
          value={size}
          options={potionSizeFilterOptions()}
          onChange={onSizeChange}
        />
      ) : (
        <FilterSelect
          label="Conjunto"
          value={set}
          options={setFilterOptions({ marketOnly: true })}
          onChange={onSetChange}
        />
      )}
    </FilterRow>
  );
}
