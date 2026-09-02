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
  includeMaterial?: boolean;
}

export function ItemFilterRow({
  category,
  set,
  size,
  onCategoryChange,
  onSetChange,
  onSizeChange,
  includeMaterial = false,
}: ItemFilterRowProps) {
  const isPotion = category === "potion";
  const isPet = category === "pet" || category === "material";

  return (
    <FilterRow>
      <FilterSelect
        accent
        label="Categoria"
        value={category}
        options={marketCategoryFilterOptions({ includeMaterial })}
        onChange={onCategoryChange}
      />
      {isPet ? null : isPotion ? (
        <FilterSelect
        accent
          label="Tamanho"
          value={size}
          options={potionSizeFilterOptions()}
          onChange={onSizeChange}
        />
      ) : (
        <FilterSelect
        accent
          label="Conjunto"
          value={set}
          options={setFilterOptions({ marketOnly: true })}
          onChange={onSetChange}
        />
      )}
    </FilterRow>
  );
}
