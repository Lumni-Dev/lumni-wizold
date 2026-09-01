"use client";

import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { listOffers, listSellables, marketPriceOf, sellPrice } from "@/controllers/market.controller";
import {
  type Item,
  CATEGORY_PLURAL,
  EQUIPMENT_SET_KEYS,
  ITEM_CATEGORIES,
  POTION_SIZES,
  EQUIPMENT_SLOTS,
  SET_LABEL,
  SIZE_LABEL,
  type EquipmentSet,
  type ItemCategory,
  type PotionSize,
} from "@/models/entities/item";
import { EQUIPMENT_SETS } from "@/models/data/equipment-sets";
import { lineageName } from "@/models/data/items";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { clampPage, pageCount, pageOf } from "@/shared/utils/pagination";
import { Button } from "../components/button";
import { Chip } from "../components/chip";
import { FilterRow, FilterSelect } from "../components/filter-select";
import { Pagination } from "../components/pagination";
import { ConfirmDialog } from "../components/confirm-dialog";
import { Field } from "../components/field";
import { enhancedName } from "@/models/rules/forge";
import { ItemCard } from "../components/item-card";
import { List, ListRow } from "../components/list";
import { ItemIcon } from "../components/item-icon";
import { Panel } from "../components/panel";
import { EmptyState } from "../components/empty-state";
import { PageHeader } from "../layout/page-header";

function clampAmount(value: number, maximum: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(maximum, Math.floor(value)));
}

interface PendingDeal {
  kind: "buy" | "sell";
  item: Item;
  quantity: number;
  total: number;
}

const PAGE_SIZE = 9;

type Tab = "buy" | "sell";
type CategoryFilter = ItemCategory | "all";
type SetFilter = EquipmentSet | "all";
type SizeFilter = PotionSize | "all";

const TABS: readonly { key: Tab; label: string }[] = [
  { key: "buy", label: "Comprar" },
  { key: "sell", label: "Vender" },
];

const CATEGORY_FILTERS: readonly { key: CategoryFilter; label: string }[] = [
  { key: "all", label: "Tudo" },
  ...ITEM_CATEGORIES.filter((category) => category !== "material").map((category) => ({
    key: category,
    label: CATEGORY_PLURAL[category],
  })),
];

const SET_FILTERS: readonly { key: SetFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  ...EQUIPMENT_SET_KEYS.filter((key) =>
    EQUIPMENT_SETS.some((definition) => definition.key === key && definition.inMarket),
  ).map((key) => ({ key, label: SET_LABEL[key] })),
];

const SIZE_FILTERS: readonly { key: SizeFilter; label: string }[] = [
  { key: "all", label: "Todas" },
  ...POTION_SIZES.map((key) => ({ key, label: SIZE_LABEL[key] })),
];

function matchesItemFilter(
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

function MarketFilters({
  category,
  setCategory,
  set,
  setSet,
  size,
  setSize,
}: {
  category: CategoryFilter;
  setCategory: (value: CategoryFilter) => void;
  set: SetFilter;
  setSet: (value: SetFilter) => void;
  size: SizeFilter;
  setSize: (value: SizeFilter) => void;
}) {
  const isPotion = category === "potion";
  const isPet = category === "pet";

  return (
    <FilterRow>
      <FilterSelect
        label="Categoria"
        value={category}
        options={CATEGORY_FILTERS}
        onChange={setCategory}
      />
      {isPet ? null : isPotion ? (
        <FilterSelect label="Tamanho" value={size} options={SIZE_FILTERS} onChange={setSize} />
      ) : (
        <FilterSelect label="Conjunto" value={set} options={SET_FILTERS} onChange={setSet} />
      )}
    </FilterRow>
  );
}

export function MarketScreen() {
  const { state, character, buyItem, sellItem } = useGame();
  const [tab, setTab] = useState<Tab>("buy");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [set, setSet] = useState<SetFilter>("all");
  const [size, setSize] = useState<SizeFilter>("all");
  const [deal, setDeal] = useState<PendingDeal | null>(null);
  const [page, setPage] = useState(1);
  const [buying, setBuying] = useState("1");
  const [selling, setSelling] = useState("1");

  const offers = useMemo(() => listOffers(state), [state]);
  const sellables = useMemo(() => listSellables(state), [state]);

  useEffect(() => {
    const sellId = new URLSearchParams(window.location.search).get("sell");
    if (!sellId) return;
    window.history.replaceState(null, "", "/market");
    const slot = sellables.find((entry) => entry.item.id === sellId);
    if (!slot) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setTab("sell");
    setSelling(String(slot.quantity));
    setDeal({ kind: "sell", item: slot.item, quantity: slot.quantity, total: 0 });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [sellables]);

  const visibleOffers = offers.filter((offer) =>
    matchesItemFilter(offer.item, category, set, size),
  );
  const visibleSellables = sellables.filter(({ item }) =>
    matchesItemFilter(item, category, set, size),
  );

  const list = tab === "buy" ? visibleOffers : visibleSellables;
  const currentPage = clampPage(page, list.length, PAGE_SIZE);
  const pages = pageCount(list.length, PAGE_SIZE);
  const offersOnPage = pageOf(visibleOffers, currentPage, PAGE_SIZE);
  const sellablesOnPage = pageOf(visibleSellables, currentPage, PAGE_SIZE);

  if (!character) return null;

  const priceOf = (item: Item) => marketPriceOf(item, character.level);
  const sellOf = (item: Item) => sellPrice(item, character.level);

  const affordableAmount =
    deal && deal.kind === "buy" ? Math.floor(character.bronze / priceOf(deal.item)) : 0;
  const dealWearable =
    deal !== null &&
    deal.kind === "buy" &&
    (EQUIPMENT_SLOTS as readonly string[]).includes(deal.item.category);
  const sellOwned =
    deal && deal.kind === "sell"
      ? (sellables.find((entry) => entry.item.id === deal.item.id)?.quantity ?? 0)
      : 0;
  const dealQuantity =
    deal && deal.kind === "buy"
      ? dealWearable
        ? 1
        : clampAmount(Number(buying), Math.max(1, affordableAmount))
      : deal && deal.kind === "sell"
        ? clampAmount(Number(selling), Math.max(1, sellOwned))
        : 1;
  const dealTotal =
    deal && deal.kind === "buy"
      ? priceOf(deal.item) * dealQuantity
      : deal && deal.kind === "sell"
        ? sellOf(deal.item) * dealQuantity
        : 0;

  function pickCategory(value: CategoryFilter) {
    setCategory(value);
    setPage(1);
  }

  function pickSet(value: SetFilter) {
    setSet(value);
    setPage(1);
  }

  function pickSize(value: SizeFilter) {
    setSize(value);
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Mercado"
        description="O ferreiro do vilarejo não pergunta de onde vem o material. Só contam as WCoins."
      />

      <div className="flex gap-2">
        {TABS.map((option) => (
          <Chip
            key={option.key}
            active={tab === option.key}
            onClick={() => {
              setTab(option.key);
              setPage(1);
            }}
          >
            {option.label}
          </Chip>
        ))}
      </div>

      {tab === "buy" ? (
        <>
          <MarketFilters
            category={category}
            setCategory={pickCategory}
            set={set}
            setSet={pickSet}
            size={size}
            setSize={pickSize}
          />

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {offersOnPage.map(
              ({ item, levelAllowed, affordable, ofLineage, ownedQuantity, reason }) => {
                const petless = item.category === "pet" && !state.pet;
                return (
                  <ItemCard
                    key={item.id}
                    item={item}
                    note={
                      ofLineage
                        ? (reason ??
                          (ownedQuantity > 0 ? formatNumber(ownedQuantity) + " no inventário" : null))
                        : null
                    }
                    footer={
                      <div className="w-full">
                        <Button
                          fullWidth
                          variant={
                            ofLineage && levelAllowed && affordable && !petless
                              ? "primary"
                              : "outline"
                          }
                          onClick={() => {
                            setBuying("1");
                            setDeal({ kind: "buy", item, quantity: 1, total: priceOf(item) });
                          }}
                          disabled={!ofLineage || !levelAllowed || !affordable || petless}
                        >
                          {petless
                            ? "Sem mascote"
                            : ofLineage
                              ? "Comprar por " + formatBronze(priceOf(item))
                              : "Apenas " + lineageName(item)}
                        </Button>
                      </div>
                    }
                  />
                );
              },
            )}
          </div>

          <Pagination page={currentPage} pages={pages} onChange={setPage} />
        </>
      ) : sellables.length === 0 ? (
        <EmptyState
          title="Nada para vender"
          description="Volte de uma caçada com loot e tente de novo."
        />
      ) : (
        <>
          <MarketFilters
            category={category}
            setCategory={pickCategory}
            set={set}
            setSet={pickSet}
            size={size}
            setSize={pickSize}
          />

          {visibleSellables.length === 0 ? (
            <EmptyState
              title="Nada neste filtro"
              description="Nenhum item do inventário combina com a categoria escolhida."
            />
          ) : (
            <Panel
              title="Sua oferta"
              description="A recompra é feita pela metade do preço de tabela."
              padding="none"
            >
              <List>
                {sellablesOnPage.map(({ item, quantity, enhancement }) => (
                  <ListRow key={item.id} layout="split">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <ItemIcon item={item} />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-ink">
                          {enhancedName(item.name, enhancement)}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                          {formatNumber(quantity)} em estoque - {formatBronze(sellOf(item))} cada
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelling(String(quantity));
                        setDeal({ kind: "sell", item, quantity, total: 0 });
                      }}
                    >
                      Vender
                    </Button>
                  </ListRow>
                ))}
              </List>
            </Panel>
          )}

          <Pagination page={currentPage} pages={pages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={deal !== null}
        title={deal?.kind === "sell" ? "Vender" : "Comprar"}
        description={
          deal
            ? deal.kind === "sell"
              ? "O ferreiro paga metade da tabela e não devolve o item depois."
              : "As WCoins saem na hora e o item vai direto para o inventário."
            : ""
        }
        detail={
          deal
            ? deal.item.name +
              (dealQuantity > 1 ? " x" + formatNumber(dealQuantity) : "") +
              " - " +
              formatBronze(dealTotal)
            : null
        }
        confirmLabel={deal?.kind === "sell" ? "Vender" : "Pagar " + formatBronze(dealTotal)}
        {...(deal?.kind === "buy" && !dealWearable
          ? {
              children: (
                <Field
                  compact
                  numeric
                  label="Quantidade"
                  hint={"Você consegue pagar por " + formatNumber(affordableAmount) + "."}
                  aria-label={"Quantidade de " + deal.item.name + " para comprar"}
                  maxLength={10}
                  className="w-full font-mono"
                  value={buying}
                  onChange={(event) => setBuying(event.target.value)}
                />
              ),
            }
          : deal?.kind === "sell" && sellOwned > 1
            ? {
                children: (
                  <Field
                    compact
                    numeric
                    label="Quantidade"
                    hint={"Você tem " + formatNumber(sellOwned) + "."}
                    aria-label={"Quantidade de " + deal.item.name + " para vender"}
                    maxLength={10}
                    className="w-full font-mono"
                    value={selling}
                    onChange={(event) => setSelling(event.target.value)}
                  />
                ),
              }
            : {})}
        onCancel={() => setDeal(null)}
        onConfirm={() => {
          if (!deal) return;

          if (deal.kind === "buy") {
            buyItem(deal.item.id, dealQuantity);
          } else {
            sellItem(deal.item.id, dealQuantity);
          }

          setDeal(null);
        }}
      />
    </>
  );
}
