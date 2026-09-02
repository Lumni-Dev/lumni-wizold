"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { activityRuntimeStore } from "@/controllers/activity-runtime";
import { useGame } from "@/controllers/game.context";
import { listForge, listMining } from "@/controllers/forge.controller";
import { useActivityLock } from "@/controllers/use-activity-lock";
import { usePageActivity } from "@/controllers/use-page-activity";
import type { Activity } from "@/models/entities/activity";
import {
  matchesCategoryAndSet,
  setFilterOptions,
  slotCategoryFilterOptions,
  type CategoryFilter,
  type SetFilter,
} from "../presenters/item-filter.presenter";
import { enhancedName } from "@/models/rules/forge";
import {
  FORGE_TICKS,
  MAX_ENHANCEMENT,
  MINING_RESET_HOUR,
  MINING_TICKS_MAX,
} from "@/shared/constants/game";
import { cn } from "@/shared/utils/class-names";
import { Field } from "../components/field";
import { FilterRow, FilterSelect } from "../components/filter-select";
import { FilteredEmptyState } from "../components/filtered-empty-state";
import { formatBronze, formatNumber } from "@/shared/utils/format";
import { clampPage, pageCount, pageOf, pageOfPosition } from "@/shared/utils/pagination";
import { normalizeText } from "@/shared/utils/text";
import { Bar } from "../components/bar";
import { Button } from "../components/button";
import { ConfirmDialog } from "../components/confirm-dialog";
import { IconFrame } from "../components/icon-frame";
import { ItemIcon } from "../components/item-icon";
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
  const { state, character, activity, setActivity } = useGame();
  usePageActivity(["mine", "forge"]);
  const { locked } = useActivityLock();
  const runtime = useSyncExternalStore(
    activityRuntimeStore.subscribe,
    activityRuntimeStore.snapshot,
    activityRuntimeStore.serverSnapshot,
  );
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
        description="A bigorna não faz peça nova: ela bate de novo na que você já usa, e o que alimenta a marreta sai da rocha. Não dá para parar no meio de uma batida, mas entre uma e outra sobram três segundos para mandar parar."
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <Panel
            title="Mina"
            description="Escolha o veio e a picareta bate nele. Cada veio pede um nível de mineração, e só o pique abre o próximo."
            padding="none"
          >
            <List>
              <ListRow layout="column">
                <Bar
                  label={
                    "Mineração NV. " + formatNumber(mining.level) + (mining.maxed ? " - teto" : "")
                  }
                  current={mining.progress}
                  maximum={mining.needed}
                  wraps
                />
              </ListRow>
              <ListRow layout="column">
                <Bar
                  label={mining.dailyExhausted ? "Fôlego da mina esgotado" : "Fôlego da mina"}
                  tone="tide"
                  current={mining.dailyRemaining}
                  maximum={mining.dailyLimit}
                />
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {"Reseta às " + RESET_LABEL + ", faltam " + formatCountdown(miningResetLeft)}
                </p>
              </ListRow>
              <ListRow layout="column">
                <Bar
                  label={activeOre ? "Minerando..." : "Minerar"}
                  current={swing.id === activeOre ? swing.beat : 0}
                  maximum={swing.id === activeOre ? swing.max : MINING_TICKS_MAX}
                  glows={activeOre !== null}
                  wraps
                />
              </ListRow>
              <ListRow layout="column">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-[11px] text-ink-faint">
                    {activeOre
                      ? mineOpting
                        ? "Segue sozinha..."
                        : state.automation.mine
                          ? "Minerando sem parar..."
                          : "Minerando..."
                      : waitingOre
                        ? "Esperando fôlego para voltar a minerar"
                        : mining.dailyExhausted
                          ? "Fôlego esgotado, reabre em " + formatCountdown(miningResetLeft)
                          : selectedEntry
                            ? selectedEntry.unlocked
                              ? selectedEntry.ore.label
                              : (selectedEntry.reason ?? "Veio bloqueado")
                            : "Escolha um veio"}
                  </span>
                  <Button
                    variant={activeOre ? "secondary" : selectedAvailable ? "primary" : "outline"}
                    disabled={
                      activeOre ? !mineOpting : !selectedAvailable || activeItem !== null || locked
                    }
                    onClick={() => toggleMining(effectiveOre, selectedAvailable)}
                    aria-label={activeOre ? "Parar de minerar" : "Minerar o veio escolhido"}
                  >
                    {mineOpting
                      ? "Parar (" + cooldown + ")"
                      : activeOre
                        ? "Minerando..."
                        : "Minerar"}
                  </Button>
                </div>
              </ListRow>
              {mining.ores.map(({ ore, fragment, owned, unlocked, reason }) => {
                const isSelected = ore.id === effectiveOre;
                return (
                  <ArtRowButton
                    key={ore.id}
                    art={fragment ? <ItemIcon item={fragment} /> : <IconFrame tone="empty" />}
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
                        <span className="shrink-0 self-center font-mono text-[11px] text-ink-faint">
                          x{formatNumber(owned)}
                        </span>
                        <span
                          className={cn(
                            "grid h-4 w-4 shrink-0 place-items-center self-center rounded-full border",
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
              title="Bigorna"
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
                    title="Nada no inventário para forjar"
                    description="Desequipe uma peça para bater nela na bigorna."
                  />
                </div>
              ) : (
                <List>
                  <ListRow padding="art">
                    <span className={cn("inline-flex", forgeActive && forgeShake && "card-shake")}>
                      <ItemIcon item={forgeEntry.item} enhancement={forgeEntry.level} />
                    </span>
                    <RowText
                      title={forgeEntry.item.name}
                      description={
                        <>
                          {forgeEntry.attributes.map((attribute) => (
                            <p key={attribute.key} className="font-mono text-ink-soft">
                              {attribute.name} {formatNumber(attribute.value)}
                              {forgeEntry.level >= MAX_ENHANCEMENT
                                ? ""
                                : " → " + formatNumber(attribute.nextValue)}
                            </p>
                          ))}
                          {forgeEntry.level > 0 ? (
                            <p className="font-mono text-[10px]">
                              Já somou +{formatNumber(forgeEntry.forgeBonus)} de forja
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
                      />
                    </ListRow>
                  ) : null}

                  <ListRow layout="column">
                    <Bar
                      label={forgeActive ? "Forjando..." : "Forjar"}
                      current={strike.id === forgeEntry.item.id ? strike.beat : 0}
                      maximum={FORGE_TICKS}
                      glows={forgeActive}
                      wraps
                    />
                  </ListRow>

                  <ListRow layout="column">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 flex-1 truncate text-[11px] text-ink-faint">
                        {forgeActive
                          ? forgeOpting
                            ? "Segue sozinho..."
                            : state.automation.forge
                              ? "Forjando sem parar..."
                              : "Forjando..."
                          : waitingItem === forgeEntry.item.id
                            ? "Esperando fragmentos e WCoins para a próxima martelada"
                            : forgeEntry.fragment && forgeEntry.level < MAX_ENHANCEMENT
                              ? "Forjar custa " + formatBronze(forgeEntry.bronzeCost)
                              : (forgeEntry.reason ?? "Peça no teto")}
                      </span>
                      <Button
                        variant={
                          forgeActive ? "secondary" : forgeEntry.canForge ? "primary" : "outline"
                        }
                        disabled={
                          forgeActive ? !forgeOpting : !forgeEntry.canForge || activeOre !== null || locked
                        }
                        onClick={() => toggleForge()}
                        aria-label={forgeActive ? "Parar de forjar" : "Forjar a peça escolhida"}
                      >
                        {forgeOpting && forgeActive
                          ? "Parar (" + cooldown + ")"
                          : forgeActive
                            ? "Forjando..."
                            : "Forjar"}
                      </Button>
                    </div>
                  </ListRow>
                </List>
              )}
            </Panel>

            <FilterRow>
              <FilterSelect
                label="Espaço"
                value={category}
                options={slotCategoryFilterOptions()}
                onChange={pickCategory}
              />
              <FilterSelect
                label="Conjunto"
                value={set}
                options={setFilterOptions()}
                onChange={pickSet}
              />
              <div className="min-w-0 flex-1 basis-40 sm:min-w-[12rem]">
                <Field
                  label="Busca"
                  aria-label="Buscar peça pelo nome"
                  placeholder="Nome da peça"
                  value={search}
                  autoComplete="off"
                  onChange={(event) => pickSearch(event.target.value)}
                />
              </div>
            </FilterRow>

            <Panel
              title="Disponíveis"
              description="Escolha o que entra na bigorna. Só peças fora do corpo aparecem aqui."
              padding="none"
            >
              {slots.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title="Nada disponível"
                    description="Desequipe uma peça para forjá-la."
                  />
                </div>
              ) : filteredSlots.length === 0 ? (
                <div className="p-4">
                  <FilteredEmptyState description="Nenhuma peça do inventário combina com os filtros escolhidos." />
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
                          art={<ItemIcon item={row.item} enhancement={row.level} />}
                          title={row.item.name}
                          description={
                            row.canForge
                              ? row.fragment && row.level < MAX_ENHANCEMENT
                                ? formatNumber(row.cost) +
                                  " " +
                                  row.fragment.name +
                                  " · " +
                                  formatBronze(row.bronzeCost)
                                : (row.reason ?? "Pronta para forjar")
                              : (row.reason ?? "Indisponível")
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
        title="Forjar"
        description="A bigorna consome os fragmentos e as WCoins na hora, e marteladas não se desfazem."
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
        confirmLabel="Forjar"
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
