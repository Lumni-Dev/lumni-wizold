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
import { cn } from "@/shared/utils/class-names";
import { Chip } from "../components/chip";
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

  const isPotion = category === "potion";
  const isPet = category === "pet";

  const visibleOffers = offers.filter((offer) => {
    if (category !== "all" && offer.item.category !== category) return false;
    if (isPet) return true;
    if (isPotion) return size === "all" || offer.item.size === size;
    return set === "all" || offer.item.set === set;
  });

  const list = tab === "buy" ? visibleOffers : sellables;
  const currentPage = clampPage(page, list.length, PAGE_SIZE);
  const pages = pageCount(list.length, PAGE_SIZE);
  const offersOnPage = pageOf(visibleOffers, currentPage, PAGE_SIZE);
  const sellablesOnPage = pageOf(sellables, currentPage, PAGE_SIZE);

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
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_FILTERS.map((option) => (
                <Chip
                  key={option.key}
                  active={category === option.key}
                  onClick={() => setCategory(option.key)}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
            <div className={cn("flex flex-wrap items-center gap-2", isPet && "hidden")}>
              <span className="mr-1 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                {isPotion ? "Tamanho" : "Conjunto"}
              </span>
              {isPotion
                ? SIZE_FILTERS.map((option) => (
                    <Chip
                      key={option.key}
                      active={size === option.key}
                      onClick={() => setSize(option.key)}
                    >
                      {option.label}
                    </Chip>
                  ))
                : SET_FILTERS.map((option) => (
                    <Chip
                      key={option.key}
                      active={set === option.key}
                      onClick={() => setSet(option.key)}
                    >
                      {option.label}
                    </Chip>
                  ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {offersOnPage.map(
              ({ item, levelAllowed, affordable, ofLineage, ownedQuantity, alreadyOwned, reason }) => {
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
                            ofLineage && levelAllowed && affordable && !petless && !alreadyOwned
                              ? "primary"
                              : "outline"
                          }
                          onClick={() => {
                            setBuying("1");
                            setDeal({ kind: "buy", item, quantity: 1, total: priceOf(item) });
                          }}
                          disabled={
                            !ofLineage || !levelAllowed || !affordable || petless || alreadyOwned
                          }
                        >
                          {petless
                            ? "Sem mascote"
                            : alreadyOwned
                              ? "Já possuo"
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

      {tab === "sell" ? <Pagination page={currentPage} pages={pages} onChange={setPage} /> : null}

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
