"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { listForge, listMining } from "@/controllers/forge.controller";
import { usePageActivity } from "@/controllers/use-page-activity";
import { playSound } from "@/controllers/sound";
import type { Activity } from "@/models/entities/activity";
import { enhancedName, forgeDurationMs } from "@/models/rules/forge";
import {
  CYCLE_OPTOUT_SECS,
  FORGE_TICKS,
  MAX_ENHANCEMENT,
  MINING_RESET_HOUR,
  MINING_TICK_MS,
  MINING_TICKS,
} from "@/shared/constants/game";
import { cn } from "@/shared/utils/class-names";
import { formatBronze, formatNumber } from "@/shared/utils/format";
import { Bar } from "../components/bar";
import { Button } from "../components/button";
import { ConfirmDialog } from "../components/confirm-dialog";
import { IconFrame } from "../components/icon-frame";
import { ItemIcon } from "../components/item-icon";
import { List, ListRow, RowText } from "../components/list";
import { Panel } from "../components/panel";
import { PageHeader } from "../layout/page-header";

function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return minutes > 0 ? hours + "h " + minutes + "min" : hours + "h";
  return minutes + "min";
}

const RESET_LABEL = String(MINING_RESET_HOUR).padStart(2, "0") + ":00";

export function ForgeScreen() {
  const { state, character, mine, enhance, activity, setActivity, notify } = useGame();
  usePageActivity(["mine", "forge"]);
  const paused = activity?.paused === true;
  const activeOre = activity?.kind === "mine" && !paused ? (activity.id ?? null) : null;
  const activeItem = activity?.kind === "forge" && !paused ? (activity.id ?? null) : null;
  const waitingOre = activity?.kind === "mine" && paused ? (activity.id ?? null) : null;
  const waitingItem = activity?.kind === "forge" && paused ? (activity.id ?? null) : null;

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

  const autoRef = useRef(state.automation);
  const mineRef = useRef(mine);
  const enhanceRef = useRef(enhance);
  const notifyRef = useRef(notify);
  const slotsRef = useRef(slots);
  useEffect(() => {
    autoRef.current = state.automation;
    mineRef.current = mine;
    enhanceRef.current = enhance;
    notifyRef.current = notify;
    slotsRef.current = slots;
  });

  const [strike, setStrike] = useState<{ id: string; beat: number }>({ id: "", beat: 0 });
  const strikeRef = useRef(0);
  const [swing, setSwing] = useState<{ id: string; beat: number }>({ id: "", beat: 0 });
  const swingRef = useRef(0);
  const [cooldown, setCooldown] = useState<number | null>(null);
  const [confirmingItem, setConfirmingItem] = useState<string | null>(null);
  const [selectedOre, setSelectedOre] = useState<string>("");

  useEffect(() => {
    if (!activeItem) return;
    let alive = true;
    let barTimer = 0;
    let coolTimer = 0;
    const level = slotsRef.current.find((entry) => entry.item.id === activeItem)?.level ?? 0;
    const tickMs = forgeDurationMs(level) / FORGE_TICKS;
    strikeRef.current = 0;
    /* eslint-disable react-hooks/set-state-in-effect */
    setStrike({ id: activeItem, beat: 0 });
    setCooldown(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    const startBar = () => {
      strikeRef.current = 0;
      setStrike({ id: activeItem, beat: 0 });
      barTimer = window.setInterval(() => {
        strikeRef.current += 1;
        setStrike({ id: activeItem, beat: strikeRef.current });
        if (strikeRef.current < FORGE_TICKS) {
          playSound("forge");
          return;
        }
        window.clearInterval(barTimer);
        barTimer = 0;
        void enhanceRef.current(activeItem).then((landed) => {
          if (!alive) return;
          if (landed) {
            if (landed.message) notifyRef.current(landed.message, true, "Bigorna");
            playSound(landed.raised ? "point" : "denied");
          }
          strikeRef.current = 0;
          setStrike({ id: activeItem, beat: 0 });
          if (!landed) {
            setActivity(
              autoRef.current.forge ? { kind: "forge", id: activeItem, paused: true } : null,
            );
            return;
          }
          if (!autoRef.current.forge) {
            setActivity(null);
            return;
          }
          startCooldown();
        });
      }, tickMs);
    };

    const startCooldown = () => {
      let left = CYCLE_OPTOUT_SECS;
      setCooldown(left);
      coolTimer = window.setInterval(() => {
        left -= 1;
        if (left <= 0) {
          window.clearInterval(coolTimer);
          coolTimer = 0;
          setCooldown(null);
          startBar();
        } else {
          setCooldown(left);
        }
      }, 1000);
    };

    startBar();

    return () => {
      alive = false;
      if (barTimer) window.clearInterval(barTimer);
      if (coolTimer) window.clearInterval(coolTimer);
    };
  }, [activeItem, setActivity]);

  useEffect(() => {
    if (!activeOre) return;
    let alive = true;
    let barTimer = 0;
    let coolTimer = 0;
    swingRef.current = 0;
    /* eslint-disable react-hooks/set-state-in-effect */
    setSwing({ id: activeOre, beat: 0 });
    setCooldown(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    const startBar = () => {
      swingRef.current = 0;
      setSwing({ id: activeOre, beat: 0 });
      barTimer = window.setInterval(() => {
        swingRef.current += 1;
        setSwing({ id: activeOre, beat: swingRef.current });
        playSound("mine");
        if (swingRef.current < MINING_TICKS) return;
        window.clearInterval(barTimer);
        barTimer = 0;
        void mineRef.current(activeOre).then((mined) => {
          if (!alive) return;
          swingRef.current = 0;
          setSwing({ id: activeOre, beat: 0 });
          if (!mined) {
            setActivity(autoRef.current.mine ? { kind: "mine", id: activeOre, paused: true } : null);
            return;
          }
          if (!autoRef.current.mine) {
            setActivity(null);
            return;
          }
          startCooldown();
        });
      }, MINING_TICK_MS);
    };

    const startCooldown = () => {
      let left = CYCLE_OPTOUT_SECS;
      setCooldown(left);
      coolTimer = window.setInterval(() => {
        left -= 1;
        if (left <= 0) {
          window.clearInterval(coolTimer);
          coolTimer = 0;
          setCooldown(null);
          startBar();
        } else {
          setCooldown(left);
        }
      }, 1000);
    };

    startBar();

    return () => {
      alive = false;
      if (barTimer) window.clearInterval(barTimer);
      if (coolTimer) window.clearInterval(coolTimer);
    };
  }, [activeOre, setActivity]);

  if (!character) return null;

  const confirming = confirmingItem
    ? (slots.find((entry) => entry.item.id === confirmingItem) ?? null)
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

  function toggleMining(oreId: string, available: boolean) {
    if (activeOre === oreId) {
      if (cooldown !== null) setActivity(null);
      return;
    }
    if (!available || activeItem !== null) return;
    setActivity({ kind: "mine", id: oreId });
  }

  return (
    <>
      <PageHeader
        title="Forja"
        description="A bigorna não faz peça nova: ela bate de novo na que você já usa, e o que alimenta a marreta sai da rocha. Não dá para parar no meio de uma batida, mas entre uma e outra sobram três segundos para mandar parar."
      />

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
              <div className="flex items-center justify-between gap-3 pt-1">
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
                          ? "+" + formatNumber(ore.progress) + " de progresso por batida"
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

        <Panel
          title="Bigorna"
          description={
            "A bigorna só bate em peça desequipada, na mochila: tire do corpo para forjar. Cada nível soma um ponto de força ou resistência mais 0,2% da peça original, até +" +
            formatNumber(MAX_ENHANCEMENT) +
            "."
          }
          padding="none"
        >
          <List>
            {slots.length === 0 ? (
              <ListRow layout="column" padding="art">
                <RowText
                  title="Nada na mochila para forjar"
                  description="Desequipe uma peça para bater nela na bigorna."
                />
              </ListRow>
            ) : (
              slots.map((row) => {
                const entry = row;
                const maxed = entry.level >= MAX_ENHANCEMENT;
                const active = activeItem === row.item.id;
                const opting = active && cooldown !== null;

                return (
                  <ListRow key={row.item.id} layout="column" padding="art">
                    <div className="flex items-center gap-3">
                      <ItemIcon item={entry.item} enhancement={entry.level} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{entry.item.name}</p>
                        {entry.fragment && !maxed ? (
                          <p className="font-mono text-[11px] text-ink-soft">
                            {formatNumber(entry.owned)} / {formatNumber(entry.cost)}{" "}
                            {entry.fragment.name}
                          </p>
                        ) : null}
                        {entry.fragment && !maxed ? (
                          <p className="font-mono text-[11px] text-ink-soft">
                            Forjar custa {formatBronze(entry.bronzeCost)}
                          </p>
                        ) : null}
                        {entry.attributes.map((attribute) => (
                          <p key={attribute.key} className="font-mono text-[11px] text-ink-soft">
                            {attribute.name} {formatNumber(attribute.value)}
                            {maxed ? "" : " → " + formatNumber(attribute.nextValue)}
                          </p>
                        ))}
                      </div>
                      <Button
                        variant={active ? "secondary" : entry.canForge ? "primary" : "outline"}
                        disabled={
                          active ? !opting : !entry.canForge || activeOre !== null
                        }
                        onClick={() =>
                          active
                            ? cooldown !== null && setActivity(null)
                            : setConfirmingItem(row.item.id)
                        }
                        aria-label={(active ? "Parar de forjar " : "Forjar ") + entry.item.name}
                      >
                        {opting ? "Parar (" + cooldown + ")" : active ? "Forjando..." : "Forjar"}
                      </Button>
                    </div>

                    {active || waitingItem === row.item.id || entry.reason ? (
                      <div className="space-y-1 pt-2">
                        {active ? (
                          <Bar
                            label="Forjando..."
                            current={strike.id === row.item.id ? strike.beat : 0}
                            maximum={FORGE_TICKS}
                            glows
                            wraps
                          />
                        ) : null}
                        {waitingItem === row.item.id ? (
                          <p className="text-[11px] text-ink-faint">
                            Esperando fragmentos e bronze para a próxima martelada
                          </p>
                        ) : entry.reason ? (
                          <p className="text-[11px] text-ink-faint">{entry.reason}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </ListRow>
                );
              })
            )}
          </List>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirming !== null}
        title="Forjar"
        description="A bigorna consome os fragmentos e o bronze na hora, e marteladas não se desfazem."
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
        onCancel={() => setConfirmingItem(null)}
        onConfirm={() => {
          if (confirming && activeOre === null && activeItem === null) {
            const next: Activity = { kind: "forge", id: confirming.item.id };
            setActivity(next);
          }
          setConfirmingItem(null);
        }}
      />
    </>
  );
}
