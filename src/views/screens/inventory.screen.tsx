"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { detailInventory } from "@/controllers/inventory.controller";
import { findItem } from "@/models/data/items";
import {
  CATEGORY_PLURAL,
  EQUIPMENT_SLOTS,
  ITEM_CATEGORIES,
  isEquippable,
  SLOT_LABEL,
  type Item,
  type ItemCategory,
} from "@/models/entities/item";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { clampPage, pageCount, pageOf } from "@/shared/utils/pagination";
import { summarizeEffect } from "../presenters/item.presenter";
import { Button } from "../components/button";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { Chip } from "../components/chip";
import { ConfirmDialog } from "../components/confirm-dialog";
import { Field } from "../components/field";
import { Pagination } from "../components/pagination";
import { IconFrame } from "../components/icon-frame";
import { enhancementOf } from "@/models/rules/forge";
import { ItemCard } from "../components/item-card";
import { ItemIcon } from "../components/item-icon";
import { Tag } from "../components/tag";
import { Panel } from "../components/panel";
import { EmptyState } from "../components/empty-state";
import { PageHeader } from "../layout/page-header";

const PAGE_SIZE = 9;

type Filter = ItemCategory | "all";

const FILTERS: readonly { key: Filter; label: string }[] = [
  { key: "all", label: "Tudo" },
  ...ITEM_CATEGORIES.map((category) => ({
    key: category,
    label: CATEGORY_PLURAL[category],
  })),
];

export function InventoryScreen() {
  const { state, character, equipItem, unequipItem, consumeItem, discardItem } = useGame();
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [discarding, setDiscarding] = useState<Item | null>(null);
  const [discardAmount, setDiscardAmount] = useState("1");

  const slots = useMemo(() => detailInventory(state), [state]);
  const visible = filter === "all" ? slots : slots.filter((slot) => slot.item.category === filter);

  const currentPage = clampPage(page, visible.length, PAGE_SIZE);
  const pages = pageCount(visible.length, PAGE_SIZE);
  const onPage = pageOf(visible, currentPage, PAGE_SIZE);
  const totalItems = slots.reduce((sum, slot) => sum + slot.quantity, 0);

  if (!character) return null;

  const discardOwned = discarding
    ? (slots.find((slot) => slot.item.id === discarding.id)?.quantity ?? 0)
    : 0;
  const discardParsed = Number(discardAmount);
  const discardCount = Number.isFinite(discardParsed)
    ? Math.max(1, Math.min(discardOwned, Math.floor(discardParsed)))
    : 1;

  return (
    <>
      <PageHeader
        title="Inventário"
        description="Tudo que você carrega. Equipe, consuma ou descarte o que só ocupa espaço."
        action={
          <div className="flex items-center gap-2">
            <Tag tone="neutral">{formatNumber(totalItems)} itens</Tag>
            <Tag tone="neutral">{formatBronze(character.bronze)}</Tag>
          </div>
        }
      />

      <Panel
        title="Equipado"
        description="Sete espaços: capacete, colar, armadura, calças, botas, garras e anel."
      >
        <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {EQUIPMENT_SLOTS.map((slot) => {
            const itemId = state.equipment[slot];
            const item = itemId ? findItem(itemId) : undefined;

            return (
              <Card key={slot} height="fill" tone={item ? "highlighted" : "empty"}>
                <CardHeader>
                  {item ? <ItemIcon item={item} /> : <IconFrame>--</IconFrame>}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      {SLOT_LABEL[slot]}
                    </p>
                    <p className="truncate text-xs text-ink">
                      {item ? item.name : "Nada equipado"}
                    </p>
                  </div>
                </CardHeader>

                {item ? (
                  <CardBody direction="row">
                    <div className="flex flex-wrap gap-2">
                      {enhancementOf(state.enhancements, item.id) > 0 ? (
                        <Tag tone="neutral">
                          Forjado +{enhancementOf(state.enhancements, item.id)}
                        </Tag>
                      ) : null}
                      {summarizeEffect(item, enhancementOf(state.enhancements, item.id)).map(
                        (effect, index) => (
                          <Tag key={index} tone="neutral">
                            {effect}
                          </Tag>
                        ),
                      )}
                    </div>
                  </CardBody>
                ) : null}

                <CardFooter>
                  <span className="text-[11px] text-ink-faint">
                    {item ? "Equipado" : "Espaço livre"}
                  </span>
                  {item ? (
                    <Button variant="outline" onClick={() => unequipItem(slot)}>
                      Tirar
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </Panel>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Chip
            key={option.key}
            active={filter === option.key}
            onClick={() => {
              setFilter(option.key);
              setPage(1);
            }}
          >
            {option.label}
          </Chip>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Nada por aqui"
          description={
            filter === "all"
              ? "Cace criaturas ou compre no mercado para encher a mochila."
              : "Nenhum item de " + CATEGORY_PLURAL[filter].toLowerCase() + " no momento."
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {onPage.map(({ item, quantity, enhancement }) => {
            const levelTooLow = character.level < item.minLevel;

            return (
              <ItemCard
                key={item.id}
                item={item}
                quantity={quantity}
                enhancement={enhancement}
                note={levelTooLow ? "Requer NV. " + item.minLevel : null}
                footer={
                  <>
                    {isEquippable(item) ? (
                      <Button
                        variant="secondary"
                        onClick={() => equipItem(item.id)}
                        disabled={levelTooLow}
                      >
                        Equipar
                      </Button>
                    ) : null}
                    {item.category === "potion" || item.category === "pet" ? (
                      <Button variant="primary" onClick={() => consumeItem(item.id)}>
                        Usar
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDiscardAmount("1");
                        setDiscarding(item);
                      }}
                    >
                      Descartar
                    </Button>
                  </>
                }
              />
            );
          })}
        </div>
      )}

      <Pagination page={currentPage} pages={pages} onChange={setPage} />

      <ConfirmDialog
        open={discarding !== null}
        title="Descartar"
        description="O que se joga fora não volta para a mochila."
        detail={
          discarding
            ? discarding.name + (discardCount > 1 ? " x" + formatNumber(discardCount) : "")
            : ""
        }
        confirmLabel="Descartar"
        onConfirm={() => {
          if (discarding) discardItem(discarding.id, discardCount);
          setDiscarding(null);
        }}
        onCancel={() => setDiscarding(null)}
      >
        {discardOwned > 1 ? (
          <Field
            compact
            numeric
            label="Quantidade"
            hint={"Você tem " + formatNumber(discardOwned) + "."}
            aria-label={"Quantidade de " + (discarding?.name ?? "") + " para descartar"}
            className="w-full font-mono"
            value={discardAmount}
            onChange={(event) => setDiscardAmount(event.target.value)}
          />
        ) : null}
      </ConfirmDialog>
    </>
  );
}
