"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/controllers/game.context";
import { detailInventory } from "@/controllers/inventory.controller";
import { findItem } from "@/models/data/items";
import {
  EQUIPMENT_SLOTS,
  isEquippable,
  SLOT_LABEL,
} from "@/models/entities/item";
import { inventoryCategoryFilterOptions, type CategoryFilter } from "../presenters/item-filter.presenter";
import { isForgeMaterial } from "@/models/rules/bazaar";
import { formatNumber } from "@/shared/utils/format";
import { clampPage, pageCount, pageOf } from "@/shared/utils/pagination";
import { summarizeEffect } from "../presenters/item.presenter";
import { Button } from "../components/button";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { FilterRow, FilterSelect } from "../components/filter-select";
import { Pagination } from "../components/pagination";
import { IconFrame } from "../components/icon-frame";
import { ItemCard } from "../components/item-card";
import { FuryUseButton } from "../components/fury-use-button";
import { ItemIcon } from "../components/item-icon";
import { RowText } from "../components/list";
import { Tag } from "../components/tag";
import { Panel } from "../components/panel";
import { EmptyState } from "../components/empty-state";
import { PageHeader } from "../layout/page-header";

const PAGE_SIZE = 9;

export function InventoryScreen() {
  const router = useRouter();
  const { state, character, equipItem, unequipItem, consumeItem } = useGame();
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [page, setPage] = useState(1);
  const [now, setNow] = useState(() => Date.now());
  const [equipLock, setEquipLock] = useState<Record<string, number>>({});
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);
  function handleEquip(itemId: string, slot: string, enhancement: number) {
    const done = equipItem(itemId, enhancement);
    setEquipLock((prev) => ({ ...prev, [slot]: Date.now() + 3000 }));
    return done;
  }

  const slots = useMemo(() => detailInventory(state), [state]);
  const visible = filter === "all" ? slots : slots.filter((slot) => slot.item.category === filter);

  const currentPage = clampPage(page, visible.length, PAGE_SIZE);
  const pages = pageCount(visible.length, PAGE_SIZE);
  const onPage = pageOf(visible, currentPage, PAGE_SIZE);
  const totalItems = slots.reduce((sum, slot) => sum + slot.quantity, 0);

  if (!character) return null;

  return (
    <>
      <PageHeader
        title="Inventário"
        description="Tudo que você carrega. Equipe, use ou venda o que só ocupa espaço."
        action={
          <div className="flex items-center gap-2">
            <Tag tone="neutral">{formatNumber(totalItems)} itens</Tag>
          </div>
        }
      />

      <Panel
        title="Equipado"
        description="Sete espaços: capacete, colar, armadura, calças, botas, luvas e anel."
      >
        <div className="grid grid-cols-1 auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {EQUIPMENT_SLOTS.map((slot) => {
            const piece = state.equipment[slot];
            const item = piece ? findItem(piece.itemId) : undefined;
            const lockSecs = Math.max(0, Math.ceil(((equipLock[slot] ?? 0) - now) / 1000));

            return (
              <Card key={slot} height="fill" tone={item ? "highlighted" : "empty"}>
                <CardHeader>
                  {item ? (
                    <ItemIcon item={item} enhancement={piece?.enhancement ?? 0} />
                  ) : (
                    <IconFrame tone="empty" />
                  )}
                  <RowText
                    label={SLOT_LABEL[slot]}
                    title={item ? item.name : "Nada equipado"}
                  />
                </CardHeader>

                {item ? (
                  <CardBody direction="row">
                    <div className="flex flex-wrap gap-2">
                      {summarizeEffect(item, piece?.enhancement ?? 0).map(
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
                    <Button
                      variant="primary"
                      onClick={() => unequipItem(slot)}
                      disabled={lockSecs > 0}
                    >
                      {lockSecs > 0 ? "Tirar (" + lockSecs + ")" : "Tirar"}
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </Panel>

      <FilterRow className="sm:max-w-xs">
        <FilterSelect
          label="Categoria"
          value={filter}
          options={inventoryCategoryFilterOptions()}
          onChange={setFilter}
          onPageReset={() => setPage(1)}
        />
      </FilterRow>

      {visible.length === 0 ? (
        <EmptyState
          title="Nada por aqui"
          description={
            filter === "all"
              ? "Cace criaturas ou compre no mercado para encher a mochila."
              : "Nenhum item de " +
                (inventoryCategoryFilterOptions().find((option) => option.key === filter)?.label ??
                  "categoria").toLowerCase() +
                " no momento."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {onPage.map(({ item, quantity, enhancement }) => {
            const levelTooLow = character.level < item.minLevel;
            const consumable = item.category === "potion" || item.category === "pet";
            const sellable = !isForgeMaterial(item);
            const hasActions = isEquippable(item) || consumable || sellable;

            return (
              <ItemCard
                key={item.id}
                item={item}
                quantity={quantity}
                enhancement={enhancement}
                fromBazaar={state.bazaarFinds.includes(item.id)}
                note={
                  levelTooLow
                    ? "Requer NV. " + item.minLevel
                    : !sellable
                      ? "Forja ou bazar"
                      : null
                }
                footer={
                  hasActions ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {sellable ? (
                          <Button
                            variant="outline"
                            onClick={() =>
                              router.push(
                                "/market?sell=" +
                                  item.id +
                                  (enhancement > 0 ? "&enh=" + enhancement : ""),
                              )
                            }
                          >
                            Vender
                          </Button>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        {isEquippable(item) ? (
                          <Button
                            variant="primary"
                            onClick={() => handleEquip(item.id, item.category, enhancement)}
                            disabled={levelTooLow}
                          >
                            Equipar
                          </Button>
                        ) : null}
                        {consumable ? (
                          item.potion === "rage" ? (
                            <FuryUseButton onClick={() => consumeItem(item.id)} />
                          ) : (
                            <Button variant="primary" onClick={() => consumeItem(item.id)}>
                              {item.category === "pet" ? "Alimentar" : "Beber"}
                            </Button>
                          )
                        ) : null}
                      </div>
                    </>
                  ) : null
                }
              />
            );
          })}
        </div>
      )}

      <Pagination page={currentPage} pages={pages} onChange={setPage} />
    </>
  );
}
