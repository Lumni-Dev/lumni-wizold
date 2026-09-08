"use client";

import { useState } from "react";
import { useGame } from "@/controllers/game.context";
import {
  listAlchemy,
  listBrewMaterials,
  type AlchemyRow,
} from "@/controllers/alchemy.controller";
import { useT } from "@/controllers/use-locale";
import { RARITY_LABEL } from "@/models/entities/item";
import { ICON_FRAME_INSET } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { formatNumber } from "@/shared/utils/format";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { ConfirmDialog } from "../components/confirm-dialog";
import { ItemArtFill } from "../components/item-icon";
import { ArtRowButton, List, RowText } from "../components/list";
import { summarizeEffect } from "../presenters/item.presenter";
import { Select } from "../components/select";
import { Tag } from "../components/tag";
import { PageHeader } from "../layout/page-header";

interface Picks {
  first: string;
  second: string;
}

interface PendingBrew {
  row: AlchemyRow;
  firstName: string;
  secondName: string;
}

const EMPTY_PICKS: Picks = { first: "", second: "" };

function requirementLine(row: AlchemyRow, t: (text: string) => string): string {
  const { first, second } = row.recipe;
  return (
    "x" +
    first.quantity +
    " " +
    t(RARITY_LABEL[first.rarity]) +
    "+ · x" +
    second.quantity +
    " " +
    t(RARITY_LABEL[second.rarity]) +
    "+"
  );
}

export function AlchemyScreen() {
  const { state, character, brewPotion } = useGame();
  const t = useT();
  const [picks, setPicks] = useState<Record<string, Picks>>({});
  const [selected, setSelected] = useState("");
  const [pending, setPending] = useState<PendingBrew | null>(null);

  if (!character) return null;

  const view = listAlchemy(state);
  const chosenRow =
    view.rows.find((row) => row.recipe.potionId === selected) ??
    view.rows.find((row) => row.unlocked) ??
    view.rows[0] ??
    null;
  const potionId = chosenRow?.recipe.potionId ?? "";
  const chosen = picks[potionId] ?? EMPTY_PICKS;

  function setPick(side: keyof Picks, value: string) {
    setPicks((current) => ({
      ...current,
      [potionId]: { ...(current[potionId] ?? EMPTY_PICKS), [side]: value },
    }));
  }

  const recipe = chosenRow?.recipe ?? null;
  const firstOptions = recipe
    ? listBrewMaterials(state, recipe.first.rarity).filter(
        (option) => option.item.id !== chosen.second,
      )
    : [];
  const secondOptions = recipe
    ? listBrewMaterials(state, recipe.second.rarity).filter(
        (option) => option.item.id !== chosen.first,
      )
    : [];
  const firstPick = firstOptions.find((option) => option.item.id === chosen.first);
  const secondPick = secondOptions.find((option) => option.item.id === chosen.second);
  const firstShort =
    recipe !== null && firstPick !== undefined && firstPick.owned < recipe.first.quantity;
  const secondShort =
    recipe !== null && secondPick !== undefined && secondPick.owned < recipe.second.quantity;
  const reason = !chosenRow
    ? "No potion to brew."
    : !chosenRow.unlocked
      ? "Requires LV. " + formatNumber(chosenRow.potion.minLevel)
      : view.flasks < 1
        ? "No empty flask in the bag: the market sells them."
        : !firstPick || !secondPick
          ? "Choose the two ingredients."
          : firstShort || secondShort
            ? "You do not have that many " +
              (firstShort ? firstPick.item.name : secondPick.item.name) +
              "."
            : null;
  const slots =
    recipe === null
      ? []
      : [
          {
            side: "first" as const,
            label: "First ingredient",
            ingredient: recipe.first,
            options: firstOptions,
            value: chosen.first,
            picked: firstPick,
          },
          {
            side: "second" as const,
            label: "Second ingredient",
            ingredient: recipe.second,
            options: secondOptions,
            value: chosen.second,
            picked: secondPick,
          },
        ];

  return (
    <>
      <PageHeader
        title="Alchemy"
        description="The cauldron turns the hunt's spoils into the market's own potions: one empty flask, two different ingredients, and the size decides how rich they must be. Brewing always costs less than the shelf, that is the pay for hunting the parts."
        action={<Tag tone="neutral">{"Empty flasks: " + formatNumber(view.flasks)}</Tag>}
      />

      <Card height="content">
        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-edge">
          <div className="flex flex-col divide-y divide-edge">
            {chosenRow ? (
              <>
                <div className="flex items-stretch">
                  <span className="flex w-20 shrink-0 items-center justify-center overflow-hidden border-r border-edge p-3 sm:w-28">
                    <span className="relative aspect-square w-full overflow-hidden">
                      <ItemArtFill item={chosenRow.potion} />
                    </span>
                  </span>
                  <div
                    className={cn(
                      "flex min-w-0 grow items-center gap-3 px-4 py-3",
                      ICON_FRAME_INSET,
                    )}
                  >
                    <RowText
                      title={chosenRow.potion.name}
                      description={
                        chosenRow.unlocked
                          ? summarizeEffect(chosenRow.potion)
                              .map((effect) => t(effect))
                              .join(", ")
                          : "Requires LV. " + formatNumber(chosenRow.potion.minLevel)
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    {t("Empty Flask")}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-mono text-[11px]",
                      view.flasks < 1 ? "text-ember" : "text-ink-soft",
                    )}
                  >
                    {formatNumber(view.flasks) + " / 1"}
                  </span>
                </div>

                {slots.map((slot) => (
                  <div key={slot.side} className="space-y-2 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                        {t(slot.label)}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-ink-soft">
                        {slot.picked
                          ? formatNumber(slot.picked.owned) + " / " + slot.ingredient.quantity
                          : "x" + slot.ingredient.quantity}
                        {" · " + t(RARITY_LABEL[slot.ingredient.rarity]) + "+"}
                      </span>
                    </div>
                    <Select
                      aria-label={t(slot.label)}
                      placeholder={t("Choose a material")}
                      value={slot.value}
                      disabled={!chosenRow.unlocked}
                      options={slot.options.map((option) => ({
                        value: option.item.id,
                        label: t(option.item.name) + " (x" + formatNumber(option.owned) + ")",
                      }))}
                      onChange={(value) => setPick(slot.side, value)}
                      className="w-full"
                    />
                  </div>
                ))}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 p-4">
                  <span className="min-w-[8rem] flex-1 text-[11px] text-ink-faint">
                    {t(reason ?? "Ready to brew")}
                  </span>
                  <Button
                    variant={reason === null ? "primary" : "outline"}
                    disabled={reason !== null}
                    onClick={() => {
                      if (!chosenRow || !firstPick || !secondPick) return;
                      setPending({
                        row: chosenRow,
                        firstName: firstPick.item.name,
                        secondName: secondPick.item.name,
                      });
                    }}
                  >
                    Brew
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-4">
                <RowText title="Nothing to brew" description="The cauldron waits for a recipe." />
              </div>
            )}
          </div>

          <div className="flex flex-col border-t border-edge md:border-t-0">
            <div className="px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                {t("Recipes")}
              </p>
            </div>
            <div className="relative md:min-h-0 md:flex-1">
              <List className="max-h-[560px] overflow-y-auto border-t border-edge md:absolute md:inset-0 md:max-h-none">
                {view.rows.map((row) => {
                  const isSelected = row.recipe.potionId === potionId;
                  return (
                    <ArtRowButton
                      key={row.recipe.potionId}
                      divided
                      artSize="compact"
                      art={<ItemArtFill item={row.potion} />}
                      title={
                        <span className={cn(isSelected ? "text-ember" : undefined)}>
                          {t(row.potion.name)}
                        </span>
                      }
                      description={
                        row.unlocked
                          ? requirementLine(row, t)
                          : "Requires LV. " + formatNumber(row.potion.minLevel)
                      }
                      trailing={
                        <span
                          className={cn(
                            "grid h-4 w-4 shrink-0 place-items-center self-center rounded-full border",
                            isSelected ? "border-ember" : "border-edge-strong",
                          )}
                        >
                          {isSelected ? <span className="h-2 w-2 rounded-full bg-ember" /> : null}
                        </span>
                      }
                      pressed={isSelected}
                      onClick={() => setSelected(row.recipe.potionId)}
                    />
                  );
                })}
              </List>
            </div>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={pending !== null}
        title="Brew"
        description="The cauldron spends the flask and the ingredients on the spot, and the potion goes straight to the bag."
        detail={
          pending
            ? t(pending.row.potion.name) +
              " - " +
              t(pending.firstName) +
              " x" +
              pending.row.recipe.first.quantity +
              ", " +
              t(pending.secondName) +
              " x" +
              pending.row.recipe.second.quantity
            : null
        }
        confirmLabel="Brew"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          const current = pending;
          const chosenPicks = picks[current.row.recipe.potionId] ?? EMPTY_PICKS;
          setPending(null);
          void brewPotion(current.row.recipe.potionId, chosenPicks.first, chosenPicks.second);
        }}
      />
    </>
  );
}
