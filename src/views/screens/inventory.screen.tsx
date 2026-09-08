"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/controllers/game.context";
import { useT } from "@/controllers/use-locale";
import { detailInventory } from "@/controllers/inventory.controller";
import { findItem } from "@/models/data/items";
import {
  EQUIPMENT_SLOTS,
  isEquippable,
  SLOT_LABEL,
} from "@/models/entities/item";
import {
  inventoryCategoryFilterOptions,
  matchesMarketItemFilter,
  type CategoryFilter,
  type SetFilter,
  type SizeFilter,
} from "../presenters/item-filter.presenter";
import { isForgeMaterial } from "@/models/rules/bazaar";
import { formatNumber } from "@/shared/utils/format";
import { clampPage, pageCount, pageOf } from "@/shared/utils/pagination";
import { normalizeText } from "@/shared/utils/text";
import { summarizeEffect } from "../presenters/item.presenter";
import { Button } from "../components/button";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { ItemFilterRow } from "../components/item-filter-row";
import { Pagination } from "../components/pagination";
import { ItemCard } from "../components/item-card";
import { FuryUseButton } from "../components/fury-use-button";
import { ItemArtFill, EmptySlotArt } from "../components/item-icon";
import { RowText } from "../components/list";
import { Tag } from "../components/tag";
import { Panel } from "../components/panel";
import { EmptyState } from "../components/empty-state";
import { PageHeader } from "../layout/page-header";

const PAGE_SIZE = 8;

export function InventoryScreen() {
  const router = useRouter();
  const { state, character, equipItem, unequipItem, consumeItem } = useGame();
  const t = useT();
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [set, setSet] = useState<SetFilter>("all");
  const [size, setSize] = useState<SizeFilter>("all");
  const [search, setSearch] = useState("");
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
  const wanted = normalizeText(search);
  const visible = slots.filter(
    (slot) =>
      matchesMarketItemFilter(slot.item, filter, set, size) &&
      (wanted === "" || normalizeText(slot.item.name).includes(wanted)),
  );

  const currentPage = clampPage(page, visible.length, PAGE_SIZE);
  const pages = pageCount(visible.length, PAGE_SIZE);
  const onPage = pageOf(visible, currentPage, PAGE_SIZE);
  const totalItems = slots.reduce((sum, slot) => sum + slot.quantity, 0);

  if (!character) return null;

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Everything you carry. Equip, use or sell what only takes up space."
        action={
          <div className="flex items-center gap-2">
            <Tag tone="neutral">{formatNumber(totalItems)} itens</Tag>
          </div>
        }
      />

      <Panel
        title="Equipped"
        description="Seven slots: helmet, necklace, armor, pants, boots, claws and ring."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {EQUIPMENT_SLOTS.map((slot) => {
            const piece = state.equipment[slot];
            const item = piece ? findItem(piece.itemId) : undefined;
            const lockSecs = Math.max(0, Math.ceil(((equipLock[slot] ?? 0) - now) / 1000));

            return (
              <Card key={slot} height="content" tone={item ? "highlighted" : "empty"}>
                <CardHeader
                  artSize="small"
                  art={
                    item ? (
                      <ItemArtFill item={item} enhancement={piece?.enhancement ?? 0} />
                    ) : (
                      <EmptySlotArt slot={slot} gender={character.gender} />
                    )
                  }
                >
                  <RowText
                    label={SLOT_LABEL[slot]}
                    title={item ? item.name : "Nothing equipped"}
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

                {item ? (
                  <CardFooter>
                    <span className="text-[11px] text-ink-faint">{t("Equipped")}</span>
                    <Button
                      variant="primary"
                      onClick={() => unequipItem(slot)}
                      disabled={lockSecs > 0}
                    >
                      {lockSecs > 0 ? "Take off (" + lockSecs + ")" : "Take off"}
                    </Button>
                  </CardFooter>
                ) : null}
              </Card>
            );
          })}
        </div>
      </Panel>

      <ItemFilterRow
        category={filter}
        set={set}
        size={size}
        onCategoryChange={(value) => {
          setFilter(value);
          setPage(1);
        }}
        onSetChange={(value) => {
          setSet(value);
          setPage(1);
        }}
        onSizeChange={(value) => {
          setSize(value);
          setPage(1);
        }}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        includeMaterial
      />

      {visible.length === 0 ? (
        <EmptyState
          title="Nothing here"
          description={
            filter === "all"
              ? "Hunt creatures or buy at the market to fill the bag."
              : "No items of " +
                (inventoryCategoryFilterOptions().find((option) => option.key === filter)?.label ??
                  "category").toLowerCase() +
                " right now."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {onPage.map(({ item, quantity, enhancement }) => {
            const levelTooLow = character.level < item.minLevel;
            const consumable = item.category === "potion" || item.category === "pet";
            const sellable = !isForgeMaterial(item);
            const fragment = !sellable;
            const actions: ReactNode[] = [];

            if (sellable) {
              actions.push(
                <Button
                  key="sell"
                  variant="outline"
                  fullWidth
                  onClick={() =>
                    router.push(
                      "/market?sell=" + item.id + (enhancement > 0 ? "&enh=" + enhancement : ""),
                    )
                  }
                >
                  Sell
                </Button>,
              );
            }

            if (fragment) {
              actions.push(
                <Button
                  key="bazaar"
                  variant="outline"
                  fullWidth
                  onClick={() => router.push("/bazaar")}
                >
                  Bazaar
                </Button>,
                <Button
                  key="forge"
                  variant="primary"
                  fullWidth
                  onClick={() => router.push("/forge")}
                >
                  Forge
                </Button>,
              );
            }

            if (isEquippable(item)) {
              actions.push(
                <Button
                  key="equip"
                  variant="primary"
                  fullWidth
                  onClick={() => handleEquip(item.id, item.category, enhancement)}
                  disabled={levelTooLow}
                >
                  Equip
                </Button>,
              );
            }

            if (consumable) {
              actions.push(
                item.potion === "rage" ? (
                  <FuryUseButton key="use" fullWidth onClick={() => consumeItem(item.id)} />
                ) : (
                  <Button
                    key="use"
                    variant="primary"
                    fullWidth
                    onClick={() => consumeItem(item.id)}
                  >
                    {item.category === "pet" ? "Feed" : "Drink"}
                  </Button>
                ),
              );
            }

            return (
              <ItemCard
                key={item.id}
                item={item}
                quantity={quantity}
                enhancement={enhancement}
                fromBazaar={state.bazaarFinds.includes(item.id)}
                note={
                  levelTooLow ? "Requires LV. " + item.minLevel : null
                }
                footer={
                  actions.length === 0 ? null : actions.length === 1 ? (
                    <div className="flex w-full justify-end">{actions}</div>
                  ) : (
                    <div className="grid w-full grid-cols-2 gap-2">
                      {actions.map((action, index) => (
                        <div key={index} className="[&>*]:w-full">
                          {action}
                        </div>
                      ))}
                    </div>
                  )
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
