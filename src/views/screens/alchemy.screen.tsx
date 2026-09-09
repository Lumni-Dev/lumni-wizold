"use client";

import { useState, useSyncExternalStore } from "react";
import { useGame } from "@/controllers/game.context";
import { listAlchemy, listBrewMaterials } from "@/controllers/alchemy.controller";
import { ACTIVITY_WAIT_LABEL, useActivityLock } from "@/controllers/use-activity-lock";
import { useVisibleActivity } from "@/controllers/use-visible-activity";
import { useT } from "@/controllers/use-locale";
import {
  brewPicksServerSnapshot,
  brewPicksSnapshot,
  loadBrewPicks,
  saveBrewPicks,
  subscribeBrewPicks,
  type BrewPicks,
} from "@/models/repositories/alchemy-selection.repository";
import { ALCHEMY_TICKS } from "@/shared/constants/game";
import { cn } from "@/shared/utils/class-names";
import { formatNumber } from "@/shared/utils/format";
import { Bar } from "../components/bar";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { ItemArtFill } from "../components/item-icon";
import { EMPTY_FLASK } from "@/models/data/consumables";
import { ArtRowButton, List, RowText } from "../components/list";
import { Select } from "../components/select";
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
  const [flash, setFlash] = useState(0);

  if (!character) return null;

  const paused = activity?.paused === true;
  const activeId = activity?.kind === "alchemy" && !paused ? (activity.id ?? null) : null;
  const waitingId = activity?.kind === "alchemy" && paused ? (activity.id ?? null) : null;
  const cycle = runtime.alchemy;
  const cooldown = cycle && activeId === cycle.id ? cycle.cooldown : null;
  const opting = activeId !== null && cooldown !== null;

  const view = listAlchemy(state);
  // A running cauldron holds the page on what it is brewing; otherwise the
  // player's own pick leads, and only with no pick does a paused job lead.
  // Without that order a click on another scroll changed nothing while a brew
  // sat paused, and the row stayed unlit.
  const focused = activeId ?? (selected || waitingId || "");
  const chosenRow =
    view.rows.find((row) => row.recipe.potionId === focused) ??
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
      ? "Requires alchemy LV. " + formatNumber(chosenRow.recipe.requiredLevel)
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
            short: !firstPick || firstShort,
          },
          {
            side: "second" as const,
            label: "Second ingredient",
            ingredient: recipe.second,
            options: secondOptions,
            value: chosen.second,
            picked: secondPick,
            short: !secondPick || secondShort,
          },
        ];
  // What the cauldron itself cannot give: the level, the scroll, the flask or
  // another job holding the slot. A missing ingredient is not one of these,
  // the button stays alive and points at the field instead.
  const blocked =
    !chosenRow ||
    !chosenRow.unlocked ||
    chosenRow.scrolls < 1 ||
    view.flasks < 1 ||
    locked;
  const missingPicks = slots.some((slot) => slot.short);

  function toggleBrew() {
    if (running) {
      if (cooldown !== null) setActivity(null);
      return;
    }
    if (blocked || !chosenRow) return;
    if (missingPicks) {
      setFlash((count) => count + 1);
      return;
    }
    setActivity({ kind: "alchemy", id: chosenRow.recipe.potionId });
  }

  return (
    <>
      <PageHeader
        title="Alchemy"
        description="The cauldron turns the hunt's spoils into the market's own potions: one empty flask, two different ingredients, and the size decides how rich they must be. Brewing always costs less than the shelf, that is the pay for hunting the parts."
      />

      <Card height="content" tone={running || waiting ? "highlighted" : "default"}>
        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-edge">
          <div className="flex flex-col divide-y divide-edge">
            <div className="space-y-1 px-4 py-3">
              <h2 className="heading text-[11px] text-ink">{t("Cauldron")}</h2>
              <p className="text-xs text-ink-faint">
                {t(
                  "Choose a potion beside and it goes on the fire. Every brew burns its scroll and a flask, and each landed potion climbs the cauldron's own ladder.",
                )}
              </p>
            </div>

            <div className="space-y-2 px-4 py-3">
              <Bar
                label={"Alchemy (LV. " + formatNumber(view.level) + "/" + formatNumber(view.maxLevel) + ")"}
                current={view.level >= view.maxLevel ? view.needed : view.progress}
                maximum={view.needed}
                tone="experience"
                wraps
              />
            </div>

            {chosenRow ? (
              <>
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

                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
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
                    variant={running ? "secondary" : blocked ? "outline" : "primary"}
                    onClick={toggleBrew}
                    disabled={running ? !opting : blocked}
                  >
                    {opting
                      ? "Stop (" + cooldown + ")"
                      : running
                        ? "Brewing..."
                        : waitLabel || "Brew"}
                  </Button>
                </div>

                {[
                  {
                    key: "scroll",
                    item: chosenRow.scroll,
                    label: chosenRow.scroll?.name ?? "Scroll",
                    owned: chosenRow.scrolls,
                  },
                  {
                    key: "flask",
                    item: EMPTY_FLASK,
                    label: "Empty Flask",
                    owned: view.flasks,
                  },
                ].map((spend) => (
                  <div key={spend.key} className="flex items-stretch">
                    <span className="flex w-16 shrink-0 items-center justify-center overflow-hidden border-r border-edge p-2 sm:w-20">
                      <span className="relative aspect-square w-full overflow-hidden">
                        {spend.item ? <ItemArtFill item={spend.item} /> : null}
                      </span>
                    </span>
                    <div className="flex min-w-0 grow items-center gap-3 px-4 py-3">
                      <span className="min-w-0 flex-1 truncate text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                        {t(spend.label)}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-ink-soft">
                        {formatNumber(spend.owned) + " / 1"}
                      </span>
                    </div>
                  </div>
                ))}

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
                      </span>
                    </div>
                    <div
                      key={slot.short && flash > 0 ? "flash-" + flash : "field"}
                      className={cn(slot.short && flash > 0 && "field-flash")}
                    >
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
                  </div>
                ))}

              </>
            ) : (
              <div className="p-4">
                <RowText title="Nothing to brew" description="The cauldron waits for a recipe." />
              </div>
            )}
          </div>

          <div className="flex flex-col border-t border-edge md:border-t-0">
            <div className="space-y-1 px-4 py-3">
              <h2 className="heading text-[11px] text-ink">{t("Potions")}</h2>
              <p className="text-xs text-ink-faint">
                {t(
                  "What the cauldron can fill, each opened by its own level, and the scroll it burns is named beside.",
                )}
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
                      title={row.potion.name}
                      description={
                        row.unlocked
                          ? "+" + formatNumber(view.effort) + " alchemy experience"
                          : "Requires alchemy LV. " + formatNumber(row.recipe.requiredLevel)
                      }
                      trailing={
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
                      }
                      pressed={isSelected}
                      disabled={!row.unlocked || activeId !== null}
                      onClick={() => row.unlocked && setSelected(row.recipe.potionId)}
                      className={cn(!row.unlocked && "opacity-60")}
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
