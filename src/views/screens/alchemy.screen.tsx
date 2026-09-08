"use client";

import { useState } from "react";
import { useGame } from "@/controllers/game.context";
import {
  listAlchemy,
  listBrewMaterials,
  type AlchemyRow,
} from "@/controllers/alchemy.controller";
import { useT } from "@/controllers/use-locale";
import type { GameState } from "@/models/entities/game-state";
import { RARITY_LABEL } from "@/models/entities/item";
import { formatNumber } from "@/shared/utils/format";
import { Button } from "../components/button";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { ConfirmDialog } from "../components/confirm-dialog";
import { DataRow } from "../components/data-row";
import { ItemArtFill } from "../components/item-icon";
import { List, ListRow, RowText } from "../components/list";
import { summarizeEffect } from "../presenters/item.presenter";
import { Select } from "../components/select";
import { Tag } from "../components/tag";
import { Tooltip } from "../components/tooltip";
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

export function AlchemyScreen() {
  const { state, character, brewPotion } = useGame();
  const t = useT();
  const [picks, setPicks] = useState<Record<string, Picks>>({});
  const [pending, setPending] = useState<PendingBrew | null>(null);

  if (!character) return null;

  const view = listAlchemy(state);

  function pickOf(potionId: string): Picks {
    return picks[potionId] ?? { first: "", second: "" };
  }

  function setPick(potionId: string, side: keyof Picks, value: string) {
    setPicks((current) => ({
      ...current,
      [potionId]: { ...pickOf(potionId), [side]: value },
    }));
  }

  return (
    <>
      <PageHeader
        title="Alchemy"
        description="The cauldron turns the hunt's spoils into the market's own potions: one empty flask, two different ingredients, and the size decides how rich they must be. Brewing always costs less than the shelf, that is the pay for hunting the parts."
        action={<Tag tone="neutral">{"Empty flasks: " + formatNumber(view.flasks)}</Tag>}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {view.rows.map((row) => (
          <RecipeCard
            key={row.recipe.potionId}
            row={row}
            state={state}
            flasks={view.flasks}
            chosen={pickOf(row.recipe.potionId)}
            onPick={(side, value) => setPick(row.recipe.potionId, side, value)}
            onBrew={(firstName, secondName) => setPending({ row, firstName, secondName })}
          />
        ))}
      </div>

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
          setPending(null);
          void brewPotion(
            current.row.recipe.potionId,
            pickOf(current.row.recipe.potionId).first,
            pickOf(current.row.recipe.potionId).second,
          );
        }}
      />
    </>
  );
}

function RecipeCard({
  row,
  state,
  flasks,
  chosen,
  onPick,
  onBrew,
}: {
  row: AlchemyRow;
  state: GameState;
  flasks: number;
  chosen: Picks;
  onPick: (side: keyof Picks, value: string) => void;
  onBrew: (firstName: string, secondName: string) => void;
}) {
  const t = useT();
  const { recipe, potion, unlocked } = row;
  const firstOptions = listBrewMaterials(state, recipe.first.rarity).filter(
    (option) => option.item.id !== chosen.second,
  );
  const secondOptions = listBrewMaterials(state, recipe.second.rarity).filter(
    (option) => option.item.id !== chosen.first,
  );
  const firstPick = firstOptions.find((option) => option.item.id === chosen.first);
  const secondPick = secondOptions.find((option) => option.item.id === chosen.second);
  const firstShort = firstPick !== undefined && firstPick.owned < recipe.first.quantity;
  const secondShort = secondPick !== undefined && secondPick.owned < recipe.second.quantity;
  const slots = [
    {
      side: "first" as const,
      label: "First ingredient",
      ingredient: recipe.first,
      options: firstOptions,
      value: chosen.first,
    },
    {
      side: "second" as const,
      label: "Second ingredient",
      ingredient: recipe.second,
      options: secondOptions,
      value: chosen.second,
    },
  ];
  const reason = !unlocked
    ? "Requires LV. " + formatNumber(potion.minLevel)
    : flasks < 1
      ? "No empty flask in the bag: the market sells them."
      : !firstPick || !secondPick
        ? "Choose the two ingredients."
        : firstShort || secondShort
          ? "You do not have that many " +
            (firstShort ? firstPick.item.name : secondPick.item.name) +
            "."
          : null;
  return (
    <Card height="fill" interactive>
      <CardHeader art={<ItemArtFill item={potion} />} artSize="small">
        <RowText
          title={potion.name}
          description={
            unlocked
              ? summarizeEffect(potion)
                  .map((effect) => t(effect))
                  .join(", ")
              : "Requires LV. " + formatNumber(potion.minLevel)
          }
        />
      </CardHeader>

      <CardBody padding="none">
        <List>
          <DataRow label="Empty Flask" value="x1" />
          {slots.map((slot) => (
            <ListRow key={slot.side} layout="column">
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    {t(slot.label)}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-ink-soft">
                    {"x" +
                      slot.ingredient.quantity +
                      " · " +
                      t(RARITY_LABEL[slot.ingredient.rarity]) +
                      "+"}
                  </span>
                </div>
                <Select
                  aria-label={t(slot.label)}
                  placeholder={t("Choose a material")}
                  value={slot.value}
                  disabled={!unlocked}
                  options={slot.options.map((option) => ({
                    value: option.item.id,
                    label: t(option.item.name) + " (x" + formatNumber(option.owned) + ")",
                  }))}
                  onChange={(value) => onPick(slot.side, value)}
                  className="w-full"
                />
              </div>
            </ListRow>
          ))}
        </List>
      </CardBody>

      <CardFooter className="w-full">
        <Tooltip block className="w-full" label={reason}>
          <Button
            variant={reason === null ? "primary" : "outline"}
            fullWidth
            disabled={reason !== null}
            onClick={() => {
              if (!firstPick || !secondPick) return;
              onBrew(firstPick.item.name, secondPick.item.name);
            }}
          >
            Brew
          </Button>
        </Tooltip>
      </CardFooter>
    </Card>
  );
}
