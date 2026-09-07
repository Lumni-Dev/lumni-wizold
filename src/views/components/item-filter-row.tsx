"use client";

import {
  marketCategoryFilterOptions,
  potionSizeFilterOptions,
  setFilterOptions,
  type CategoryFilter,
  type SetFilter,
  type SizeFilter,
} from "../presenters/item-filter.presenter";
import { Field } from "./field";
import { FILTER_COLUMN, FilterRow, FilterSelect } from "./filter-select";

interface ItemFilterRowProps {
  category: CategoryFilter;
  set: SetFilter;
  size: SizeFilter;
  onCategoryChange: (value: CategoryFilter) => void;
  onSetChange: (value: SetFilter) => void;
  onSizeChange: (value: SizeFilter) => void;
  includeMaterial?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchLabel?: string;
}

export function ItemFilterRow({
  category,
  set,
  size,
  onCategoryChange,
  onSetChange,
  onSizeChange,
  includeMaterial = false,
  search,
  onSearchChange,
  searchLabel = "Search item by name",
}: ItemFilterRowProps) {
  const isPotion = category === "potion";
  const isPet = category === "pet" || category === "material";

  return (
    <FilterRow>
      <FilterSelect
        accent
        label="Category"
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
          label="Set"
          value={set}
          options={setFilterOptions({ marketOnly: true })}
          onChange={onSetChange}
        />
      )}
      {onSearchChange ? (
        <div className={FILTER_COLUMN}>
          <Field
            accent
            label="Search"
            aria-label={searchLabel}
            placeholder="Item name"
            value={search ?? ""}
            autoComplete="off"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      ) : null}
    </FilterRow>
  );
}
