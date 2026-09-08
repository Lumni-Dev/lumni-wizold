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
import { formatNumber } from "@/shared/utils/format";
import { Button } from "../components/button";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { ConfirmDialog } from "../components/confirm-dialog";
import { DataRow } from "../components/data-row";
import { ItemIcon } from "../components/item-icon";
import { List, RowText } from "../components/list";
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
        {view.rows.map((row) => {
          const { recipe, potion, unlocked } = row;
          const chosen = pickOf(recipe.potionId);
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
          const reason = !unlocked
            ? "Requires LV. " + formatNumber(potion.minLevel)
            : view.flasks < 1
              ? "No empty flask in the bag: the market sells them."
              : !firstPick || !secondPick
                ? "Choose the two ingredients."
                : firstShort || secondShort
                  ? "You do not have that many " +
                    (firstShort ? firstPick.item.name : secondPick.item.name) +
                    "."
                  : null;
          return (
            <Card key={recipe.potionId} height="fill">
              <CardHeader art={<ItemIcon item={potion} />}>
                <RowText
                  title={potion.name}
                  label={unlocked ? t(RARITY_LABEL[potion.rarity]) : "Requires LV. " + formatNumber(potion.minLevel)}
                />
              </CardHeader>

              <CardBody padding="none">
                <List>
                  <DataRow label="Empty Flask" value="x1" />
                  <DataRow
                    label="First ingredient"
                    value={"x" + recipe.first.quantity + " · " + t(RARITY_LABEL[recipe.first.rarity]) + "+"}
                  />
                  <DataRow
                    label="Second ingredient"
                    value={"x" + recipe.second.quantity + " · " + t(RARITY_LABEL[recipe.second.rarity]) + "+"}
                  />
                </List>
                <div className="space-y-3 border-t border-edge p-4">
                  <Select
                    label={t("First ingredient")}
                    placeholder={t("Choose a material")}
                    value={chosen.first}
                    disabled={!unlocked}
                    options={firstOptions.map((option) => ({
                      value: option.item.id,
                      label: t(option.item.name) + " (x" + formatNumber(option.owned) + ")",
                    }))}
                    onChange={(value) => setPick(recipe.potionId, "first", value)}
                    className="w-full"
                  />
                  <Select
                    label={t("Second ingredient")}
                    placeholder={t("Choose a material")}
                    value={chosen.second}
                    disabled={!unlocked}
                    options={secondOptions.map((option) => ({
                      value: option.item.id,
                      label: t(option.item.name) + " (x" + formatNumber(option.owned) + ")",
                    }))}
                    onChange={(value) => setPick(recipe.potionId, "second", value)}
                    className="w-full"
                  />
                  {firstOptions.length === 0 && secondOptions.length === 0 ? (
                    <p className="text-xs text-ink-faint">
                      {t("Nothing in the bag serves this potion yet: the hunt drops what the cauldron asks.")}
                    </p>
                  ) : null}
                </div>
              </CardBody>

              <CardFooter className="w-full">
                <Tooltip block className="w-full" label={reason}>
                  <Button
                    variant={reason === null ? "primary" : "outline"}
                    fullWidth
                    disabled={reason !== null}
                    onClick={() => {
                      if (!firstPick || !secondPick) return;
                      setPending({
                        row,
                        firstName: firstPick.item.name,
                        secondName: secondPick.item.name,
                      });
                    }}
                  >
                    Brew
                  </Button>
                </Tooltip>
              </CardFooter>
            </Card>
          );
        })}
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
