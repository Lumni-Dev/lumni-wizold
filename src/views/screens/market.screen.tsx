"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { listOffers, listSellables, marketPriceOf, sellPrice } from "@/controllers/market.controller";
import {
  type Item,
  EQUIPMENT_SLOTS,
} from "@/models/entities/item";
import { lineageName } from "@/models/data/items";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { clampPage, pageCount, pageOf } from "@/shared/utils/pagination";
import { normalizeText } from "@/shared/utils/text";
import {
  matchesMarketItemFilter,
  type CategoryFilter,
  type SetFilter,
  type SizeFilter,
} from "../presenters/item-filter.presenter";
import { Button } from "../components/button";
import { ChipTabs } from "../components/chip-tabs";
import { ItemFilterRow } from "../components/item-filter-row";
import { Pagination } from "../components/pagination";
import { ConfirmDialog } from "../components/confirm-dialog";
import { QuantityField } from "../components/quantity-field";
import { enhancedName } from "@/models/rules/forge";
import { ItemCard } from "../components/item-card";
import { EmptyState } from "../components/empty-state";
import { FilteredEmptyState } from "../components/filtered-empty-state";
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
  enhancement: number;
}

const PAGE_SIZE = 6;

type Tab = "buy" | "sell";

const TABS: readonly { key: Tab; label: string }[] = [
  { key: "buy", label: "Comprar" },
  { key: "sell", label: "Vender" },
];

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
  const [search, setSearch] = useState("");
  const [sold, setSold] = useState<{ id: string; enhancement: number; quantity: number } | null>(
    null,
  );
  const openedSell = useRef(false);

  const offers = useMemo(() => listOffers(state), [state]);
  const sellables = useMemo(() => {
    const rows = listSellables(state);
    if (!sold) return rows;
    return rows.flatMap((entry) => {
      if (entry.item.id !== sold.id || entry.enhancement !== sold.enhancement) return [entry];
      const left = entry.quantity - sold.quantity;
      if (left <= 0) return [];
      return [{ ...entry, quantity: left }];
    });
  }, [state, sold]);

  useEffect(() => {
    if (openedSell.current) return;
    const params = new URLSearchParams(window.location.search);
    const sellId = params.get("sell");
    if (!sellId) return;
    const sellEnhancement = Math.max(0, Number(params.get("enh")) || 0);
    const slot = sellables.find(
      (entry) => entry.item.id === sellId && entry.enhancement === sellEnhancement,
    );
    if (!slot) return;
    openedSell.current = true;
    window.history.replaceState(null, "", "/market");
    /* eslint-disable react-hooks/set-state-in-effect */
    setTab("sell");
    setSelling(String(slot.quantity));
    setDeal({
      kind: "sell",
      item: slot.item,
      quantity: slot.quantity,
      total: 0,
      enhancement: slot.enhancement,
    });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [sellables]);

  const wanted = normalizeText(search);
  const named = (name: string) => wanted === "" || normalizeText(name).includes(wanted);
  const visibleOffers = offers.filter(
    (offer) => matchesMarketItemFilter(offer.item, category, set, size) && named(offer.item.name),
  );
  const visibleSellables = sellables.filter(
    ({ item }) => matchesMarketItemFilter(item, category, set, size) && named(item.name),
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
      ? (sellables.find(
          (entry) => entry.item.id === deal.item.id && entry.enhancement === deal.enhancement,
        )?.quantity ?? 0)
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

  function pickSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Mercado"
        description="O ferreiro do vilarejo não pergunta de onde vem o material. Só contam as WCoins."
      />

      <ChipTabs
        tabs={TABS}
        value={tab}
        onChange={(next) => {
          setTab(next);
          setPage(1);
          if (next === "buy" && category === "material") setCategory("all");
        }}
      />

      {tab === "buy" ? (
        <>
          <ItemFilterRow
            category={category}
            set={set}
            size={size}
            onCategoryChange={pickCategory}
            onSetChange={pickSet}
            onSizeChange={pickSize}
            search={search}
            onSearchChange={pickSearch}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                            setDeal({
                              kind: "buy",
                              item,
                              quantity: 1,
                              total: priceOf(item),
                              enhancement: 0,
                            });
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
          <ItemFilterRow
            category={category}
            set={set}
            size={size}
            onCategoryChange={pickCategory}
            onSetChange={pickSet}
            onSizeChange={pickSize}
            search={search}
            onSearchChange={pickSearch}
            includeMaterial
          />

          {visibleSellables.length === 0 ? (
            <FilteredEmptyState description="Nenhum item do inventário combina com a categoria escolhida." />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sellablesOnPage.map(({ item, quantity, enhancement }) => (
                <ItemCard
                  key={item.id + "-" + enhancement}
                  item={item}
                  quantity={quantity}
                  enhancement={enhancement}
                  note="A recompra paga metade do preço de tabela."
                  footer={
                    <div className="w-full">
                      <Button
                        fullWidth
                        variant="primary"
                        onClick={() => {
                          setSelling(String(quantity));
                          setDeal({ kind: "sell", item, quantity, total: 0, enhancement });
                        }}
                      >
                        {"Vender por " + formatBronze(sellOf(item))}
                      </Button>
                    </div>
                  }
                />
              ))}
            </div>
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
            ? enhancedName(deal.item.name, deal.enhancement) +
              (dealQuantity > 1 ? " x" + formatNumber(dealQuantity) : "") +
              " - " +
              formatBronze(dealTotal)
            : null
        }
        confirmLabel={deal?.kind === "sell" ? "Vender" : "Pagar " + formatBronze(dealTotal)}
        onCancel={() => setDeal(null)}
        onConfirm={() => {
          if (!deal) return;
          const current = deal;
          const quantity = dealQuantity;
          setDeal(null);
          if (current.kind === "buy") {
            void buyItem(current.item.id, quantity);
            return;
          }
          setSold({
            id: current.item.id,
            enhancement: current.enhancement,
            quantity,
          });
          void sellItem(current.item.id, quantity, current.enhancement).finally(() => setSold(null));
        }}
      >
        {deal?.kind === "buy" && !dealWearable ? (
          <QuantityField
            className="w-full"
            hint={"Você consegue pagar por " + formatNumber(affordableAmount) + "."}
            aria-label={"Quantidade de " + deal.item.name + " para comprar"}
            value={buying}
            onChange={setBuying}
          />
        ) : deal?.kind === "sell" ? (
          <QuantityField
            className="w-full"
            hint={"Você tem " + formatNumber(sellOwned) + "."}
            aria-label={"Quantidade de " + deal.item.name + " para vender"}
            value={selling}
            onChange={setSelling}
          />
        ) : null}
      </ConfirmDialog>
    </>
  );
}
