"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { listOffers, listSellables, sellPrice } from "@/controllers/market.controller";
import {
  type Item,
  CATEGORY_PLURAL,
  EQUIPMENT_SET_KEYS,
  ITEM_CATEGORIES,
  POTION_SIZES,
  SET_LABEL,
  SIZE_LABEL,
  type EquipmentSet,
  type ItemCategory,
  type PotionSize,
} from "@/models/entities/item";
import { EQUIPMENT_SETS } from "@/models/data/equipment-sets";
import { lineageName } from "@/models/data/items";
import { GENDERS, type Gender } from "@/models/entities/character";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { clampPage, pageCount, pageOf } from "@/shared/utils/pagination";
import { Button } from "../components/button";
import { cn } from "@/shared/utils/class-names";
import { Chip } from "../components/chip";
import { Pagination } from "../components/pagination";
import { ConfirmDialog } from "../components/confirm-dialog";
import { Field } from "../components/field";
import { enhancedName, enhancementOf } from "@/models/rules/forge";
import { ItemCard } from "../components/item-card";
import { List, ListRow } from "../components/list";
import { ItemIcon } from "../components/item-icon";
import { Tag } from "../components/tag";
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
type LineageFilter = Gender | "all";

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

const LINEAGE_FILTERS: readonly { key: LineageFilter; label: string }[] = [
  { key: "all", label: "Todas" },
  ...GENDERS.map((gender) => ({ key: gender.key, label: gender.label })),
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
  const [lineage, setLineage] = useState<LineageFilter>("all");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [deal, setDeal] = useState<PendingDeal | null>(null);
  const [page, setPage] = useState(1);
  const [buying, setBuying] = useState("1");

  const offers = useMemo(() => listOffers(state), [state]);
  const sellables = useMemo(() => listSellables(state), [state]);

  const isPotion = category === "potion";
  const isPet = category === "pet";
  const hasLineage = offers.some((offer) => offer.item.lineage !== undefined);

  const visibleOffers = offers.filter((offer) => {
    if (category !== "all" && offer.item.category !== category) return false;
    if (lineage !== "all" && offer.item.lineage !== undefined && offer.item.lineage !== lineage) {
      return false;
    }
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

  const affordableAmount =
    deal && deal.kind === "buy" ? Math.floor(character.bronze / deal.item.price) : 0;
  const dealQuantity =
    deal && deal.kind === "buy"
      ? clampAmount(Number(buying), Math.max(1, affordableAmount))
      : (deal?.quantity ?? 1);
  const dealTotal =
    deal && deal.kind === "buy" ? deal.item.price * dealQuantity : (deal?.total ?? 0);

  return (
    <>
      <PageHeader
        title="Mercado"
        description="O ferreiro do vilarejo não pergunta de onde vem o material. Só conta o bronze."
        action={<Tag tone="neutral">{formatBronze(character.bronze)}</Tag>}
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
            <div className={cn("flex flex-wrap items-center gap-2", !hasLineage && "hidden")}>
              <span className="mr-1 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                Linhagem
              </span>
              {LINEAGE_FILTERS.map((option) => (
                <Chip
                  key={option.key}
                  active={lineage === option.key}
                  onClick={() => {
                    setLineage(option.key);
                    setPage(1);
                  }}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {offersOnPage.map(
              ({ item, levelAllowed, affordable, ofLineage, ownedQuantity, reason }) => {
                const petless = item.category === "pet" && !state.pet;
                return (
                  <ItemCard
                    key={item.id}
                    item={item}
                    enhancement={enhancementOf(state.enhancements, item.id)}
                    note={
                      ofLineage
                        ? (reason ??
                          (ownedQuantity > 0 ? formatNumber(ownedQuantity) + " na mochila" : null))
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
                            setDeal({ kind: "buy", item, quantity: 1, total: item.price });
                          }}
                          disabled={!ofLineage || !levelAllowed || !affordable || petless}
                        >
                          {petless
                            ? "Sem mascote"
                            : ofLineage
                              ? "Comprar por " + formatBronze(item.price)
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
            {sellablesOnPage.map(({ item, quantity, enhancement }) => {
              const typed = amounts[item.id];
              const amount = clampAmount(
                typed === undefined || typed === "" ? quantity : Number(typed),
                quantity,
              );
              const total = sellPrice(item) * amount;

              return (
                <ListRow key={item.id} layout="split">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <ItemIcon item={item} />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink">
                        {enhancedName(item.name, enhancement)}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                        {formatNumber(quantity)} em estoque · {formatBronze(sellPrice(item))} cada
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      Quantidade
                    </span>
                    <div className="flex items-center gap-2">
                      <Field
                        numeric
                        compact
                        aria-label={"Quantidade de " + item.name + " para vender"}
                        className="w-24 text-right font-mono"
                        value={typed ?? String(quantity)}
                        onChange={(event) =>
                          setAmounts((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setDeal({
                            kind: "sell",
                            item,
                            quantity: amount,
                            total: sellPrice(item) * amount,
                          })
                        }
                      >
                        Vender por {formatBronze(total)}
                      </Button>
                    </div>
                  </div>
                </ListRow>
              );
            })}
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
              : "O bronze sai na hora e o item vai direto para o inventário."
            : ""
        }
        detail={
          deal
            ? deal.item.name +
              (dealQuantity > 1 ? " x" + formatNumber(dealQuantity) : "") +
              " · " +
              formatBronze(dealTotal)
            : null
        }
        confirmLabel={deal?.kind === "sell" ? "Vender" : "Pagar " + formatBronze(dealTotal)}
        {...(deal?.kind === "buy"
          ? {
              children: (
                <Field
                  compact
                  numeric
                  label="Quantidade"
                  hint={"Você consegue pagar por " + formatNumber(affordableAmount) + "."}
                  aria-label={"Quantidade de " + deal.item.name + " para comprar"}
                  className="w-full font-mono"
                  value={buying}
                  onChange={(event) => setBuying(event.target.value)}
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
            sellItem(deal.item.id, deal.quantity);
            setAmounts((current) => {
              const next = { ...current };
              delete next[deal.item.id];
              return next;
            });
          }

          setDeal(null);
        }}
      />
    </>
  );
}
