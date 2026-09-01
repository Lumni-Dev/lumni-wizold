"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { activityRuntimeStore } from "@/controllers/activity-runtime";
import { useGame } from "@/controllers/game.context";
import { listForge, listMining } from "@/controllers/forge.controller";
import { usePageActivity } from "@/controllers/use-page-activity";
import type { Activity } from "@/models/entities/activity";
import {
  EQUIPMENT_SET_KEYS,
  EQUIPMENT_SLOTS,
  SET_LABEL,
  SLOT_LABEL,
  type EquipmentSet,
  type ItemCategory,
} from "@/models/entities/item";
import { enhancedName } from "@/models/rules/forge";
import { FORGE_TICKS, MAX_ENHANCEMENT, MINING_RESET_HOUR, MINING_TICKS } from "@/shared/constants/game";
import { cn } from "@/shared/utils/class-names";
import { Chip } from "../components/chip";
import { formatBronze, formatNumber } from "@/shared/utils/format";
import { clampPage, pageCount, pageOf, pageOfPosition } from "@/shared/utils/pagination";
import { Bar } from "../components/bar";
import { Button } from "../components/button";
import { ConfirmDialog } from "../components/confirm-dialog";
import { IconFrame } from "../components/icon-frame";
import { ItemIcon } from "../components/item-icon";
import { EmptyState } from "../components/empty-state";
import { ItemCard } from "../components/item-card";
import { List, ListRow, RowText } from "../components/list";
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

const FORGE_PAGE_SIZE = 9;

type CategoryFilter = ItemCategory | "all";
type SetFilter = EquipmentSet | "all";

const FORGE_CATEGORY_FILTERS: readonly { key: CategoryFilter; label: string }[] = [
  { key: "all", label: "Tudo" },
  ...EQUIPMENT_SLOTS.map((slot) => ({ key: slot, label: SLOT_LABEL[slot] })),
];

const FORGE_SET_FILTERS: readonly { key: SetFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  ...EQUIPMENT_SET_KEYS.map((key) => ({ key, label: SET_LABEL[key] })),
];

function ForgeCategoryFilters({
  category,
  onChange,
}: {
  category: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[10px] uppercase tracking-[0.16em] text-ink-faint">Forja</span>
      {FORGE_CATEGORY_FILTERS.map((option) => (
        <Chip
          key={option.key}
          active={category === option.key}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
}

function ForgeSetFilters({
  set,
  onChange,
}: {
  set: SetFilter;
  onChange: (value: SetFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        Disponíveis
      </span>
      {FORGE_SET_FILTERS.map((option) => (
        <Chip key={option.key} active={set === option.key} onClick={() => onChange(option.key)}>
          {option.label}
        </Chip>
      ))}
    </div>
  );
}

export function ForgeScreen() {
  const { state, character, activity, setActivity } = useGame();
  usePageActivity(["mine", "forge"]);
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
      ? { id: mineRt.id, beat: mineRt.beat }
      : { id: activeOre ?? "", beat: 0 };
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
  const forgeShake = useShake(strike.beat);

  const filteredSlots = useMemo(
    () =>
      slots.filter((row) => {
        if (category !== "all" && row.item.category !== category) return false;
        return set === "all" || row.item.set === set;
      }),
    [slots, category, set],
  );

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

  const forgeFallback = filteredSlots.find((entry) => entry.canForge) ?? filteredSlots[0] ?? null;
  const selectedValid = filteredSlots.some(
    (entry) => pieceKey(entry.item.id, entry.level) === selectedForge,
  );
  const displayLevel = activeItem !== null ? (activeForgeLevel ?? activeStartLevel) : activityLevel;
  const effectiveForge =
    forgeItemId !== null
      ? pieceKey(forgeItemId, displayLevel)
      : selectedValid
        ? selectedForge
        : forgeFallback
          ? pieceKey(forgeFallback.item.id, forgeFallback.level)
          : "";
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
        <div className="grid items-start gap-6 lg:grid-cols-2">
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
                maximum={MINING_TICKS}
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
                  disabled={activeOre ? !mineOpting : !selectedAvailable || activeItem !== null}
                  onClick={() => toggleMining(effectiveOre, selectedAvailable)}
                  aria-label={activeOre ? "Parar de minerar" : "Minerar o veio escolhido"}
                >
                  {mineOpting ? "Parar (" + cooldown + ")" : activeOre ? "Minerando..." : "Minerar"}
                </Button>
              </div>
            </ListRow>
            {mining.ores.map(({ ore, fragment, owned, unlocked, reason }) => {
              const isSelected = ore.id === effectiveOre;
              return (
                <ListRow key={ore.id}>
                  <button
                    type="button"
                    onClick={() => unlocked && setSelectedOre(ore.id)}
                    aria-pressed={isSelected}
                    disabled={!unlocked || activeOre !== null}
                    className={cn(
                      "flex w-full items-center gap-3 text-left transition-colors",
                      !unlocked && "opacity-60",
                    )}
                  >
                    {fragment ? <ItemIcon item={fragment} /> : <IconFrame>--</IconFrame>}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm",
                          isSelected
                            ? "text-ember"
                            : unlocked
                              ? "text-ink-soft"
                              : "text-ink-faint",
                        )}
                      >
                        {ore.label}
                      </p>
                      <p className="text-[11px] text-ink-faint">
                        {unlocked
                          ? "+" +
                            formatNumber(ore.minYield) +
                            " a " +
                            formatNumber(ore.maxYield) +
                            " fragmentos por batida"
                          : reason}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-ink-faint">
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
                  </button>
                </ListRow>
              );
            })}
          </List>
        </Panel>

          <div className="space-y-3">
            <ForgeCategoryFilters category={category} onChange={pickCategory} />

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
              <div className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <span className={cn("inline-flex", forgeActive && forgeShake && "card-shake")}>
                    <ItemIcon item={forgeEntry.item} enhancement={forgeEntry.level} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{forgeEntry.item.name}</p>
                    {forgeEntry.attributes.map((attribute) => (
                      <p key={attribute.key} className="font-mono text-[11px] text-ink-soft">
                        {attribute.name} {formatNumber(attribute.value)}
                        {forgeEntry.level >= MAX_ENHANCEMENT
                          ? ""
                          : " → " + formatNumber(attribute.nextValue)}
                      </p>
                    ))}
                    {forgeEntry.level > 0 ? (
                      <p className="font-mono text-[10px] text-ink-faint">
                        Já somou +{formatNumber(forgeEntry.forgeBonus)} de forja
                      </p>
                    ) : null}
                  </div>
                </div>

                {forgeEntry.fragment && forgeEntry.level < MAX_ENHANCEMENT ? (
                  <Bar
                    label={forgeEntry.fragment.name}
                    tone="ember"
                    current={forgeEntry.owned}
                    maximum={forgeEntry.cost}
                  />
                ) : null}

                <Bar
                  label={forgeActive ? "Forjando..." : "Forjar"}
                  current={strike.id === forgeEntry.item.id ? strike.beat : 0}
                  maximum={FORGE_TICKS}
                  glows={forgeActive}
                  wraps
                />

                <div className="-mx-4 flex items-center justify-between gap-3 border-t border-edge px-4 pt-4">
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
                    size="medium"
                    variant={
                      forgeActive ? "secondary" : forgeEntry.canForge ? "primary" : "outline"
                    }
                    disabled={forgeActive ? !forgeOpting : !forgeEntry.canForge || activeOre !== null}
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
              </div>
            )}
            </Panel>
          </div>
        </div>

        <div className="space-y-3">
          <ForgeSetFilters set={set} onChange={pickSet} />

          {slots.length === 0 ? (
            <EmptyState
              title="Nada disponível"
              description="Desequipe uma peça para forjá-la."
            />
          ) : filteredSlots.length === 0 ? (
            <EmptyState
              title="Nada neste filtro"
              description="Nenhuma peça do inventário combina com a categoria escolhida."
            />
          ) : (
            <>
              <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {forgeOnPage.map((row) => {
                  const key = pieceKey(row.item.id, row.level);
                  const isSelected = key === effectiveForge;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => selectForge(key)}
                      aria-pressed={isSelected}
                      disabled={activeItem !== null}
                      className="h-full text-left disabled:opacity-60"
                    >
                      <ItemCard
                        item={row.item}
                        quantity={row.quantity}
                        enhancement={row.level}
                        highlighted={isSelected}
                      />
                    </button>
                  );
                })}
              </div>
              {forgePages > 1 ? (
                <Pagination page={forgeCurrentPage} pages={forgePages} onChange={setForgePage} />
              ) : null}
            </>
          )}
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
