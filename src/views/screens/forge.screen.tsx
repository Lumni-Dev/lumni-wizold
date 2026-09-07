"use client";

import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { listForge, listMining } from "@/controllers/forge.controller";
import { ACTIVITY_WAIT_LABEL, useActivityLock } from "@/controllers/use-activity-lock";
import { useT } from "@/controllers/use-locale";
import { useVisibleActivity } from "@/controllers/use-visible-activity";
import type { Activity } from "@/models/entities/activity";
import {
  matchesCategoryAndSet,
  setFilterOptions,
  slotCategoryFilterOptions,
  type CategoryFilter,
  type SetFilter,
} from "../presenters/item-filter.presenter";
import { enhancedName } from "@/models/rules/forge";
import { totalExperience } from "@/models/rules/progression";
import {
  FORGE_TICKS,
  MAX_ENHANCEMENT,
  MINING_RESET_HOUR,
  MINING_TICKS_MAX,
} from "@/shared/constants/game";
import { cn } from "@/shared/utils/class-names";
import { Field } from "../components/field";
import { FILTER_COLUMN, FilterRow, FilterSelect } from "../components/filter-select";
import { FilteredEmptyState } from "../components/filtered-empty-state";
import { formatBronze, formatFraction, formatNumber } from "@/shared/utils/format";
import { clampPage, pageCount, pageOf, pageOfPosition } from "@/shared/utils/pagination";
import { normalizeText } from "@/shared/utils/text";
import { Bar } from "../components/bar";
import { Button } from "../components/button";
import { GainDelta } from "../components/gain-delta";
import { ConfirmDialog } from "../components/confirm-dialog";
import { ItemArtFill } from "../components/item-icon";
import { EmptyState } from "../components/empty-state";
import { ArtRowButton, RowText, List, ListRow } from "../components/list";
import { Pagination } from "../components/pagination";
import { Panel } from "../components/panel";
import { useShake } from "../components/use-shake";
import { PageHeader } from "../layout/page-header";

function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return minutes > 0 ? hours + "h " + minutes + "min" : hours + "h";
  return minutes + "min";
}

const RESET_LABEL = String(MINING_RESET_HOUR).padStart(2, "0") + ":00";

function pieceKey(itemId: string, level: number): string {
  return itemId + "@" + level;
}

const FORGE_PAGE_SIZE = 5;

export function ForgeScreen() {
  const { state, character, setActivity } = useGame();
  const t = useT();
  const { locked } = useActivityLock();
  const waitLabel = locked ? ACTIVITY_WAIT_LABEL : "";
  const { activity, runtime } = useVisibleActivity();
  const paused = activity?.paused === true;
  const activeOre = activity?.kind === "mine" && !paused ? (activity.id ?? null) : null;
  const forgeItemId = activity?.kind === "forge" ? (activity.id ?? null) : null;
  const activityLevel = activity?.kind === "forge" ? (activity.enhancement ?? 0) : 0;
  const activeItem = forgeItemId !== null && !paused ? forgeItemId : null;
  const activeStartLevel = activeItem !== null ? activityLevel : 0;
  const waitingOre = activity?.kind === "mine" && paused ? (activity.id ?? null) : null;
  const waitingItem = activity?.kind === "forge" && paused ? (activity.id ?? null) : null;
  const mineRt = runtime.mine;
  const forgeRt = runtime.forge;
  const swing =
    mineRt && activeOre === mineRt.id
      ? { id: mineRt.id, beat: mineRt.beat, max: mineRt.max }
      : { id: activeOre ?? "", beat: 0, max: MINING_TICKS_MAX };
  const strike =
    forgeRt && activeItem === forgeRt.id
      ? { id: forgeRt.id, beat: forgeRt.beat }
      : { id: activeItem ?? "", beat: 0 };
  const mineCooldown = mineRt && activeOre === mineRt.id ? mineRt.cooldown : null;
  const forgeCooldown = forgeRt && activeItem === forgeRt.id ? forgeRt.cooldown : null;
  const cooldown = mineCooldown ?? forgeCooldown;
  const activeForgeLevel =
    forgeRt && activeItem === forgeRt.id ? forgeRt.level : activeStartLevel;

  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  const mining = useMemo(() => listMining(state, now || undefined), [state, now]);
  const slots = useMemo(() => listForge(state), [state]);
  const miningResetLeft = mining.dailyResetsInMs;

  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);
  const [selectedOre, setSelectedOre] = useState<string>("");
  const [selectedForge, setSelectedForge] = useState<string>("");
  const [forgePage, setForgePage] = useState(1);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [set, setSet] = useState<SetFilter>("all");
  const [search, setSearch] = useState("");
  const forgeShake = useShake(strike.beat);

  const filteredSlots = useMemo(() => {
    const wanted = normalizeText(search);
    return slots.filter(
      (row) =>
        matchesCategoryAndSet(row.item, category, set) &&
        (wanted === "" || normalizeText(row.item.name).includes(wanted)),
    );
  }, [slots, category, set, search]);

  function selectForge(key: string) {
    setSelectedForge(key);
    const index = filteredSlots.findIndex((entry) => pieceKey(entry.item.id, entry.level) === key);
    if (index >= 0) setForgePage(pageOfPosition(index + 1, FORGE_PAGE_SIZE));
  }

  if (!character) return null;

  const confirming = confirmingKey
    ? (slots.find((entry) => pieceKey(entry.item.id, entry.level) === confirmingKey) ?? null)
    : null;

  const unlockedOres = mining.ores.filter((entry) => entry.unlocked);
  const effectiveOre =
    activeOre ??
    mining.ores.find((entry) => entry.ore.id === selectedOre)?.ore.id ??
    unlockedOres.at(-1)?.ore.id ??
    mining.ores[0]?.ore.id ??
    "";
  const selectedEntry = mining.ores.find((entry) => entry.ore.id === effectiveOre) ?? null;
  const selectedAvailable = Boolean(selectedEntry?.unlocked) && !mining.dailyExhausted;
  const mineOpting = activeOre !== null && cooldown !== null;

  const forgeFallbackKey = filteredSlots[0]
    ? pieceKey(filteredSlots[0].item.id, filteredSlots[0].level)
    : "";
  const selectedValid = filteredSlots.some(
    (entry) => pieceKey(entry.item.id, entry.level) === selectedForge,
  );
  const displayLevel = activeItem !== null ? (activeForgeLevel ?? activeStartLevel) : activityLevel;
  const effectiveForge =
    forgeItemId !== null
      ? pieceKey(forgeItemId, displayLevel)
      : selectedValid
        ? selectedForge
        : forgeFallbackKey;
  const forgeEntry =
    filteredSlots.find((entry) => pieceKey(entry.item.id, entry.level) === effectiveForge) ??
    slots.find((entry) => pieceKey(entry.item.id, entry.level) === effectiveForge) ??
    null;
  const forgeOpting = activeItem !== null && cooldown !== null;
  const forgeActive =
    activeItem !== null && forgeEntry !== null && activeItem === forgeEntry.item.id;

  const forgeCurrentPage = clampPage(forgePage, filteredSlots.length, FORGE_PAGE_SIZE);
  const forgePages = pageCount(filteredSlots.length, FORGE_PAGE_SIZE);
  const forgeOnPage = pageOf(filteredSlots, forgeCurrentPage, FORGE_PAGE_SIZE);

  function toggleMining(oreId: string, available: boolean) {
    if (activeOre === oreId) {
      if (cooldown !== null) setActivity(null);
      return;
    }
    if (!available || activeItem !== null) return;
    setActivity({ kind: "mine", id: oreId });
  }

  function toggleForge() {
    if (!forgeEntry) return;
    if (activeItem !== null) {
      if (cooldown !== null) setActivity(null);
      return;
    }
    if (!forgeEntry.canForge || activeOre !== null) return;
    setConfirmingKey(pieceKey(forgeEntry.item.id, forgeEntry.level));
  }

  function pickSearch(value: string) {
    setSearch(value);
    setForgePage(1);
  }

  function pickCategory(value: CategoryFilter) {
    setCategory(value);
    setForgePage(1);
  }

  function pickSet(value: SetFilter) {
    setSet(value);
    setForgePage(1);
  }

  return (
    <>
      <PageHeader
        title="Forja"
        description="The anvil makes nothing new: it strikes again the piece you already own, and what feeds the hammer comes out of the rock. You cannot stop mid-strike, but between one and the next there are three seconds to call it off."
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <Panel
            title="Mina"
            description="Choose the vein and the pick strikes it. Each vein asks for a mining level, and only the pick opens the next."
            padding="none"
          >
            <List>
              <ListRow layout="column">
                <Bar
                  label={
                    "Experiência (NV. " +
                    formatNumber(mining.level) +
                    "/1000)" +
                    (mining.maxed ? " - teto" : "")
                  }
                  current={mining.progress}
                  maximum={mining.needed}
                  tone="experience"
                  delta={
                    mining.maxed ? undefined : (
                      <GainDelta total={totalExperience(mining.level, mining.progress)} />
                    )
                  }
                  deltaTone="experience"
                  wraps
                />
              </ListRow>
              <ListRow layout="column">
                <Bar
                  label={mining.dailyExhausted ? "Mine resources spent" : "Mine resources"}
                  tone="tide"
                  current={mining.dailyRemaining}
                  maximum={mining.dailyLimit}
                  delta={
                    <GainDelta total={mining.dailyLimit - mining.dailyRemaining} sign="-" />
                  }
                  deltaTone="tide"
                />
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {t("Reseta às " + RESET_LABEL + ", faltam " + formatCountdown(miningResetLeft))}
                </p>
              </ListRow>
              <ListRow layout="column">
                <Bar
                  label={activeOre ? "Mining..." : "Mine"}
                  current={swing.id === activeOre ? swing.beat : 0}
                  maximum={swing.id === activeOre ? swing.max : MINING_TICKS_MAX}
                  glows={activeOre !== null}
                  hideValue={swing.id !== activeOre || swing.beat === 0}
                  wraps
                />
              </ListRow>
              <ListRow layout="column">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-[11px] text-ink-faint">
                    {t(
                      activeOre
                        ? mineOpting
                          ? "Runs on its own..."
                          : state.automation.mine
                            ? "Mining non-stop..."
                            : "Mining..."
                        : waitingOre
                          ? "Waiting for resources to mine again"
                          : mining.dailyExhausted
                            ? "Recursos esgotados, voltam em " + formatCountdown(miningResetLeft)
                            : selectedEntry
                              ? selectedEntry.unlocked
                                ? selectedEntry.ore.label
                                : (selectedEntry.reason ?? "Vein locked")
                              : "Choose a vein",
                    )}
                  </span>
                  <Button
                    variant={activeOre ? "secondary" : selectedAvailable ? "primary" : "outline"}
                    disabled={
                      activeOre ? !mineOpting : !selectedAvailable || activeItem !== null || locked
                    }
                    onClick={() => toggleMining(effectiveOre, selectedAvailable)}
                    aria-label={activeOre ? "Stop mining" : "Mine the chosen vein"}
                  >
                    {mineOpting
                      ? "Parar (" + cooldown + ")"
                      : activeOre
                        ? "Mining..."
                        : waitLabel || "Mine"}
                  </Button>
                </div>
              </ListRow>
              {mining.ores.map(({ ore, fragment, owned, unlocked, reason }) => {
                const isSelected = ore.id === effectiveOre;
                return (
                  <ArtRowButton
                    key={ore.id}
                    art={fragment ? <ItemArtFill item={fragment} /> : null}
                    divided
                    title={ore.label}
                    description={
                      unlocked
                        ? "+" +
                          formatNumber(ore.minYield) +
                          " a " +
                          formatNumber(ore.maxYield) +
                          " fragmentos por mineração"
                        : reason
                    }
                    trailing={
                      <>
                        <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                          <GainDelta total={owned} className="mr-1 font-bold text-ember" />
                          x{formatNumber(owned)}
                        </span>
                        <span
                          className={cn(
                            "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                            isSelected ? "border-ember" : "border-edge-strong",
                          )}
                        >
                          {isSelected ? <span className="h-2 w-2 rounded-full bg-ember" /> : null}
                        </span>
                      </>
                    }
                    pressed={isSelected}
                    disabled={!unlocked || activeOre !== null}
                    onClick={() => unlocked && setSelectedOre(ore.id)}
                    className={cn(!unlocked && "opacity-60")}
                  />
                );
              })}
            </List>
          </Panel>

          <div className="space-y-3">
            <Panel
              title="Anvil"
              description={
                "Escolha uma peça em Disponíveis e ela entra na bigorna. Cada nível soma 0,3% dos atributos da peça original, então um set forte rende muito e uma peça barata sobe devagar, até +" +
                formatNumber(MAX_ENHANCEMENT) +
                "."
              }
              padding="none"
            >
              {!forgeEntry ? (
                <div className="p-4">
                  <RowText
                    title="Nothing in the bag to forge"
                    description="Unequip a piece to strike it on the anvil."
                  />
                </div>
              ) : (
                <List>
                  <ListRow padding="art">
                    <span
                      className={cn(
                        "flex aspect-square w-20 shrink-0 overflow-hidden rounded-md border border-edge p-1.5",
                        forgeActive && forgeShake && "card-shake",
                      )}
                    >
                      <ItemArtFill item={forgeEntry.item} enhancement={forgeEntry.level} />
                    </span>
                    <RowText
                      title={forgeEntry.item.name}
                      description={
                        <>
                          {forgeEntry.attributes.map((attribute) => (
                            <p key={attribute.key} className="font-mono text-ink-soft">
                              {t(attribute.name)} {formatFraction(attribute.exact)}
                              {forgeEntry.level >= MAX_ENHANCEMENT ? (
                                ""
                              ) : (
                                <>
                                  {" → " + formatFraction(attribute.nextExact)}
                                  <span className="text-ink-faint">
                                    {" (+" + formatFraction(attribute.gain) + " " + t("per level") + ")"}
                                  </span>
                                </>
                              )}
                            </p>
                          ))}
                          {forgeEntry.level > 0 ? (
                            <p className="font-mono text-[10px]">
                              {t("Already added")} +{formatFraction(forgeEntry.exactBonus)}{" "}
                              {t("of attributes from the forge")}
                            </p>
                          ) : null}
                        </>
                      }
                    />
                  </ListRow>

                  {forgeEntry.fragment && forgeEntry.level < MAX_ENHANCEMENT ? (
                    <ListRow layout="column">
                      <Bar
                        label={forgeEntry.fragment.name}
                        tone="ember"
                        current={forgeEntry.owned}
                        maximum={forgeEntry.cost}
                        delta={<GainDelta total={forgeEntry.owned} />}
                        deltaTone="ember"
                      />
                    </ListRow>
                  ) : null}

                  <ListRow layout="column">
                    <Bar
                      label={forgeActive ? "Forging..." : "Forge"}
                      current={strike.id === forgeEntry.item.id ? strike.beat : 0}
                      maximum={FORGE_TICKS}
                      glows={forgeActive}
                      hideValue={strike.id !== forgeEntry.item.id || strike.beat === 0}
                      wraps
                    />
                  </ListRow>

                  <ListRow layout="column">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 flex-1 truncate text-[11px] text-ink-faint">
                        {t(
                          forgeActive
                            ? forgeOpting
                              ? "Runs on its own..."
                              : state.automation.forge
                                ? "Forging non-stop..."
                                : "Forging..."
                            : waitingItem === forgeEntry.item.id
                              ? "Waiting for fragments and WCoins for the next strike"
                              : forgeEntry.fragment && forgeEntry.level < MAX_ENHANCEMENT
                                ? "Forjar custa " + formatBronze(forgeEntry.bronzeCost)
                                : (forgeEntry.reason ?? "Piece at the cap"),
                        )}
                      </span>
                      <Button
                        variant={
                          forgeActive ? "secondary" : forgeEntry.canForge ? "primary" : "outline"
                        }
                        disabled={
                          forgeActive ? !forgeOpting : !forgeEntry.canForge || activeOre !== null || locked
                        }
                        onClick={() => toggleForge()}
                        aria-label={forgeActive ? "Stop forging" : "Forge the chosen piece"}
                      >
                        {forgeOpting && forgeActive
                          ? "Parar (" + cooldown + ")"
                          : forgeActive
                            ? "Forging..."
                            : waitLabel || "Forge"}
                      </Button>
                    </div>
                  </ListRow>
                </List>
              )}
            </Panel>

            <FilterRow>
              <FilterSelect
              accent
                label="Slot"
                value={category}
                options={slotCategoryFilterOptions()}
                onChange={pickCategory}
              />
              <FilterSelect
              accent
                label="Set"
                value={set}
                options={setFilterOptions()}
                onChange={pickSet}
              />
              <div className={FILTER_COLUMN}>
                <Field
                  accent
                  label="Search"
                  aria-label="Search piece by name"
                  placeholder="Piece name"
                  value={search}
                  autoComplete="off"
                  onChange={(event) => pickSearch(event.target.value)}
                />
              </div>
            </FilterRow>

            <Panel
              title="Available"
              description="Choose what goes on the anvil. Only pieces off the body appear here."
              padding="none"
            >
              {slots.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title="Nothing available"
                    description="Unequip a piece to forge it."
                  />
                </div>
              ) : filteredSlots.length === 0 ? (
                <div className="p-4">
                  <FilteredEmptyState description="No piece in the bag matches the chosen filters." />
                </div>
              ) : (
                <>
                  <List>
                    {forgeOnPage.map((row) => {
                      const key = pieceKey(row.item.id, row.level);
                      const isSelected = key === effectiveForge;
                      return (
                        <ArtRowButton
                          key={key}
                          art={
                            <span className="flex aspect-square w-16 shrink-0 overflow-hidden rounded-md border border-edge p-1.5">
                              <ItemArtFill item={row.item} enhancement={row.level} />
                            </span>
                          }
                          title={row.item.name}
                          description={
                            row.canForge
                              ? row.fragment && row.level < MAX_ENHANCEMENT
                                ? formatNumber(row.cost) +
                                  " " +
                                  row.fragment.name +
                                  " · " +
                                  formatBronze(row.bronzeCost)
                                : (row.reason ?? "Ready to forge")
                              : (row.reason ?? "Unavailable")
                          }
                          trailing={
                            <>
                              {row.quantity > 1 ? (
                                <span className="shrink-0 self-center font-mono text-[11px] text-ink-faint">
                                  x{formatNumber(row.quantity)}
                                </span>
                              ) : null}
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
                          disabled={activeItem !== null}
                          onClick={() => selectForge(key)}
                        />
                      );
                    })}
                  </List>
                  {forgePages > 1 ? (
                    <div className="border-t border-edge p-3">
                      <Pagination
                        page={forgeCurrentPage}
                        pages={forgePages}
                        onChange={setForgePage}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </Panel>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirming !== null}
        title="Forge"
        description="The anvil consumes the fragments and WCoins on the spot, and strikes cannot be undone."
        detail={
          confirming && confirming.fragment
            ? enhancedName(confirming.item.name, confirming.level) +
              " → +" +
              formatNumber(confirming.level + 1) +
              " - custa " +
              formatNumber(confirming.cost) +
              " " +
              confirming.fragment.name +
              " e " +
              formatBronze(confirming.bronzeCost)
            : undefined
        }
        confirmLabel="Forge"
        onCancel={() => setConfirmingKey(null)}
        onConfirm={() => {
          if (confirming && activeOre === null && activeItem === null) {
            const next: Activity = {
              kind: "forge",
              id: confirming.item.id,
              enhancement: confirming.level,
            };
            setActivity(next);
          }
          setConfirmingKey(null);
        }}
      />
    </>
  );
}
