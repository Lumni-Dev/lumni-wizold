"use client";

import { useState, useSyncExternalStore } from "react";
import { useGame } from "@/controllers/game.context";
import { listAlchemy, listBrewMaterials } from "@/controllers/alchemy.controller";
import { ACTIVITY_WAIT_LABEL, useActivityLock } from "@/controllers/use-activity-lock";
import { useVisibleActivity } from "@/controllers/use-visible-activity";
import { useT } from "@/controllers/use-locale";
import { RARITY_LABEL } from "@/models/entities/item";
import {
  brewPicksServerSnapshot,
  brewPicksSnapshot,
  loadBrewPicks,
  saveBrewPicks,
  subscribeBrewPicks,
  type BrewPicks,
} from "@/models/repositories/alchemy-selection.repository";
import { ALCHEMY_TICKS } from "@/shared/constants/game";
import { ICON_FRAME_INSET } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { formatNumber } from "@/shared/utils/format";
import { Bar } from "../components/bar";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { ItemArtFill } from "../components/item-icon";
import { ArtRowButton, List, RowText } from "../components/list";
import { summarizeEffect } from "../presenters/item.presenter";
import { Select } from "../components/select";
import { Tag } from "../components/tag";
import { PageHeader } from "../layout/page-header";

const EMPTY_PICKS: BrewPicks = { first: "", second: "" };

export function AlchemyScreen() {
  const { state, character, setActivity } = useGame();
  const t = useT();
  const { locked } = useActivityLock();
  const waitLabel = locked ? ACTIVITY_WAIT_LABEL : "";
  const { activity, runtime } = useVisibleActivity();
  const picks = useSyncExternalStore(
    subscribeBrewPicks,
    brewPicksSnapshot,
    brewPicksServerSnapshot,
  );
  const [selected, setSelected] = useState("");

  if (!character) return null;

  const paused = activity?.paused === true;
  const activeId = activity?.kind === "alchemy" && !paused ? (activity.id ?? null) : null;
  const waitingId = activity?.kind === "alchemy" && paused ? (activity.id ?? null) : null;
  const cycle = runtime.alchemy;
  const cooldown = cycle && activeId === cycle.id ? cycle.cooldown : null;
  const opting = activeId !== null && cooldown !== null;

  const view = listAlchemy(state);
  const chosenRow =
    view.rows.find((row) => row.recipe.potionId === (activeId ?? waitingId ?? selected)) ??
    view.rows.find((row) => row.unlocked) ??
    view.rows[0] ??
    null;
  const potionId = chosenRow?.recipe.potionId ?? "";
  const chosen = picks[potionId] ?? EMPTY_PICKS;
  const running = activeId === potionId;
  const waiting = waitingId === potionId;

  function setPick(side: keyof BrewPicks, value: string) {
    const current = loadBrewPicks();
    saveBrewPicks({
      ...current,
      [potionId]: { ...(current[potionId] ?? EMPTY_PICKS), [side]: value },
    });
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
      : chosenRow.scrolls < 1
        ? "No scroll for this potion: the market sells them."
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

  function toggleBrew() {
    if (running) {
      if (cooldown !== null) setActivity(null);
      return;
    }
    if (reason !== null || locked || !chosenRow) return;
    setActivity({ kind: "alchemy", id: chosenRow.recipe.potionId });
  }

  return (
    <>
      <PageHeader
        title="Alchemy"
        description="The cauldron turns the hunt's spoils into the market's own potions: one empty flask, two different ingredients, and the size decides how rich they must be. Brewing always costs less than the shelf, that is the pay for hunting the parts."
        action={<Tag tone="neutral">{"Empty flasks: " + formatNumber(view.flasks)}</Tag>}
      />

      <Card height="content" tone={running || waiting ? "highlighted" : "default"}>
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
                  <span className="min-w-0 truncate text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    {t(chosenRow.scroll?.name ?? "Scroll")}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-ink-soft">
                    {formatNumber(chosenRow.scrolls) + " / 1"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    {t("Empty Flask")}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-ink-soft">
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
                      disabled={!chosenRow.unlocked || running}
                      options={slot.options.map((option) => ({
                        value: option.item.id,
                        label: t(option.item.name) + " (x" + formatNumber(option.owned) + ")",
                      }))}
                      onChange={(value) => setPick(slot.side, value)}
                      className="w-full"
                    />
                  </div>
                ))}

                <div className="px-4 py-3">
                  <Bar
                    label={running ? "Brewing..." : "Brew"}
                    current={running && cycle ? cycle.beat : 0}
                    maximum={ALCHEMY_TICKS}
                    glows={running}
                    hideValue={!running || !cycle || cycle.beat === 0}
                    wraps
                  />
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 p-4">
                  <span className="min-w-[8rem] flex-1 text-[11px] text-ink-faint">
                    {t(
                      running
                        ? opting
                          ? "You can stop now or fill the next flask."
                          : state.automation.alchemy
                            ? "Brewing non-stop..."
                            : "Brewing..."
                        : waiting
                          ? "Waiting for a flask and the ingredients"
                          : (reason ?? "Ready to brew"),
                    )}
                  </span>
                  <Button
                    variant={running ? "secondary" : reason === null ? "primary" : "outline"}
                    onClick={toggleBrew}
                    disabled={running ? !opting : reason !== null || locked}
                  >
                    {opting
                      ? "Stop (" + cooldown + ")"
                      : running
                        ? "Brewing..."
                        : waitLabel || "Brew"}
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
                {t("Scrolls")}
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
                          {t(row.scroll?.name ?? row.potion.name)}
                        </span>
                      }
                      description={
                        row.unlocked
                          ? undefined
                          : "Requires LV. " + formatNumber(row.potion.minLevel)
                      }
                      trailing={
                        <>
                          <span className="shrink-0 self-center font-mono text-[11px] text-ink-faint">
                            x{formatNumber(row.scrolls)}
                          </span>
                          <span
                            className={cn(
                              "grid h-4 w-4 shrink-0 place-items-center self-center rounded-full border",
                              isSelected ? "border-ember" : "border-edge-strong",
                            )}
                          >
                            {isSelected ? (
                              <span className="h-2 w-2 rounded-full bg-ember" />
                            ) : null}
                          </span>
                        </>
                      }
                      pressed={isSelected}
                      disabled={activeId !== null}
                      onClick={() => setSelected(row.recipe.potionId)}
                    />
                  );
                })}
              </List>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
