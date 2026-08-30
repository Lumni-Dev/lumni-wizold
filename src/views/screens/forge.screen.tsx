"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { listForge, listMining } from "@/controllers/forge.controller";
import { usePageActivity } from "@/controllers/use-page-activity";
import { playSound } from "@/controllers/sound";
import { progressRepository } from "@/models/repositories/progress.repository";
import type { Activity } from "@/models/entities/activity";
import { enhancedName, forgeDurationMs } from "@/models/rules/forge";
import {
  FORGE_TICKS,
  MAX_ENHANCEMENT,
  MINING_RESET_HOUR,
  MINING_TICK_MS,
  MINING_TICKS,
} from "@/shared/constants/game";
import { formatBronze, formatNumber } from "@/shared/utils/format";
import { Bar } from "../components/bar";
import { Button } from "../components/button";
import { ConfirmDialog } from "../components/confirm-dialog";
import { IconFrame } from "../components/icon-frame";
import { ItemIcon } from "../components/item-icon";
import { List, ListRow, RowText } from "../components/list";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
import { PageHeader } from "../layout/page-header";

// A live countdown to the daily reset, in hours and minutes: "3h 24min", "24min".
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

  // A clock that ticks so the reset countdown stays live and the 06:00 refill
  // lands on screen on its own. Starts at 0 and lets listMining fall back to its
  // own Date.now() until the first tick, keeping Date.now() out of render.
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
  // A switch between the pick and the anvil waits for the running cycle to land
  // before it takes over, so a charged lap is never thrown away. The click is
  // held here and applied at the next landing.
  const [pending, setPending] = useState<Activity | null>(null);
  const pendingRef = useRef<Activity | null>(null);

  const [confirmingItem, setConfirmingItem] = useState<string | null>(null);

  useEffect(() => {
    if (!activeItem) return;

    const key = "forge:" + activeItem;
    // Resume from the banked beat: a paused anvil picks up where it froze, and a
    // fresh one starts at zero.
    strikeRef.current = progressRepository.get(key, FORGE_TICKS);
    setStrike({ id: activeItem, beat: strikeRef.current });
    const level = slotsRef.current.find((entry) => entry.item.id === activeItem)?.level ?? 0;
    const tickMs = forgeDurationMs(level) / FORGE_TICKS;
    const timer = window.setInterval(() => {
      strikeRef.current = strikeRef.current >= FORGE_TICKS ? 0 : strikeRef.current + 1;
      setStrike({ id: activeItem, beat: strikeRef.current });

      // Every beat before the last is the hammer swinging and nothing is charged
      // yet, so stopping here spends nothing and lands nothing.
      if (strikeRef.current > 0 && strikeRef.current < FORGE_TICKS) {
        playSound("forge");
        return;
      }
      if (strikeRef.current < FORGE_TICKS) return;

      // Last beat: the server charges the fragments and bronze, rolls the dice and
      // lands the level in one call. The lap is done, so its banked position clears.
      progressRepository.clear(key);
      void enhanceRef.current(activeItem).then((landed) => {
        if (landed) {
          if (landed.message) notifyRef.current(landed.message, true, "Bigorna");
          playSound(landed.raised ? "point" : "denied");
        }
        if (pendingRef.current) {
          const next = pendingRef.current;
          pendingRef.current = null;
          setPending(null);
          strikeRef.current = 0;
          setStrike({ id: activeItem, beat: 0 });
          setActivity(next);
          return;
        }
        if (landed && autoRef.current.forge) return; // chain: let the interval wrap to a new lap
        strikeRef.current = 0;
        setStrike({ id: activeItem, beat: 0 });
        setActivity(
          !landed && autoRef.current.forge ? { kind: "forge", id: activeItem, paused: true } : null,
        );
      });
    }, tickMs);

    // Leaving mid-lap banks the exact beat so the anvil resumes there; a lap that
    // already landed reset the ref to zero, so this clears instead.
    return () => {
      window.clearInterval(timer);
      progressRepository.set("forge:" + activeItem, strikeRef.current);
    };
  }, [activeItem, setActivity]);

  const [swing, setSwing] = useState<{ id: string; beat: number }>({ id: "", beat: 0 });
  const swingRef = useRef(0);

  useEffect(() => {
    if (!activeOre) return;

    const key = "mine:" + activeOre;
    // Resume the pick from where it froze; a fresh vein starts at zero.
    swingRef.current = progressRepository.get(key, MINING_TICKS);
    setSwing({ id: activeOre, beat: swingRef.current });
    const timer = window.setInterval(() => {
      swingRef.current = swingRef.current >= MINING_TICKS ? 0 : swingRef.current + 1;
      setSwing({ id: activeOre, beat: swingRef.current });

      if (swingRef.current > 0) playSound("mine");

      if (swingRef.current < MINING_TICKS) return;
      // Last beat: the swing lands on the server, which charges the daily quota and
      // hands out the fragments. Stopping earlier spends nothing and yields nothing.
      progressRepository.clear(key);
      void mineRef.current(activeOre).then((mined) => {
        if (!mined) {
          swingRef.current = 0;
          setSwing({ id: activeOre, beat: 0 });
          if (pendingRef.current) {
            const next = pendingRef.current;
            pendingRef.current = null;
            setPending(null);
            setActivity(next);
            return;
          }
          setActivity(autoRef.current.mine ? { kind: "mine", id: activeOre, paused: true } : null);
          return;
        }
        if (pendingRef.current) {
          const next = pendingRef.current;
          pendingRef.current = null;
          setPending(null);
          swingRef.current = 0;
          setSwing({ id: activeOre, beat: 0 });
          setActivity(next);
          return;
        }
        if (!autoRef.current.mine) {
          swingRef.current = 0;
          setSwing({ id: activeOre, beat: 0 });
          setActivity(null);
        }
      });
    }, MINING_TICK_MS);

    // Leaving mid-swing banks the exact beat; a landed swing reset the ref to zero,
    // so this clears instead.
    return () => {
      window.clearInterval(timer);
      progressRepository.set("mine:" + activeOre, swingRef.current);
    };
  }, [activeOre, setActivity]);

  if (!character) return null;

  const confirming = confirmingItem
    ? (slots.find((entry) => entry.item.id === confirmingItem) ?? null)
    : null;

  function queueSwitch(next: Activity | null) {
    pendingRef.current = next;
    setPending(next);
  }

  function toggleMining(oreId: string, available: boolean) {
    // Already mining this vein: stop, dropping any queued switch. The bar freezes
    // at the exact beat and the effect cleanup banks it, so resuming picks up here
    // instead of restarting, and the interrupted swing lands nothing.
    if (activeOre === oreId) {
      queueSwitch(null);
      setActivity(null);
      return;
    }
    // This vein is already queued: cancel it, the running cycle keeps going.
    if (pending?.kind === "mine" && pending.id === oreId) {
      queueSwitch(null);
      return;
    }
    if (!available) return;

    const next: Activity = { kind: "mine", id: oreId };
    // Busy at the anvil or another vein: wait for the running cycle to land.
    if (activeOre !== null || activeItem !== null) {
      queueSwitch(next);
      return;
    }
    // Idle: start now.
    swingRef.current = 0;
    setSwing({ id: oreId, beat: 0 });
    setActivity(next);
  }

  return (
    <>
      <PageHeader
        title="Forja"
        description="A bigorna não faz peça nova: ela bate de novo na que você já usa, e o que alimenta a marreta sai da rocha."
        action={
          <div className="flex items-center gap-2">
            <Tag tone="neutral">Mineração NV. {formatNumber(mining.level)}</Tag>
          </div>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel
          title="Mina"
          description="Cada veio pede um nível de mineração, e só o pique abre o próximo."
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
            {mining.ores.map(({ ore, fragment, owned, unlocked, reason }) => {
              const active = activeOre === ore.id;
              const queuedMine = pending?.kind === "mine" && pending.id === ore.id;
              const available = unlocked && !mining.dailyExhausted;
              const limitReason =
                unlocked && mining.dailyExhausted
                  ? "Limite de hoje atingido. Reabre em " + formatCountdown(miningResetLeft)
                  : reason;

              return (
                <ListRow key={ore.id} layout="column" padding="art">
                  <div className="flex items-center gap-3">
                    {fragment ? <ItemIcon item={fragment} /> : <IconFrame>--</IconFrame>}
                    <RowText
                      title={ore.label}
                      description={
                        active
                          ? state.automation.mine
                            ? "Minerando sem parar..."
                            : "Minerando..."
                          : queuedMine
                            ? "Na fila, começa quando o ciclo atual acabar"
                            : waitingOre === ore.id
                              ? "Esperando para bater de novo"
                              : (limitReason ??
                                "+" + formatNumber(ore.progress) + " de progresso por batida")
                      }
                    />
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-mono text-[11px] text-ink-faint">
                        x{formatNumber(owned)}
                      </span>
                      <Button
                        variant={active || queuedMine ? "secondary" : available ? "primary" : "outline"}
                        disabled={!available && !active && !queuedMine}
                        onClick={() => toggleMining(ore.id, available)}
                        aria-label={
                          (queuedMine
                            ? "Cancelar fila de "
                            : active
                              ? "Parar de minerar "
                              : "Minerar ") + ore.label
                        }
                      >
                        {queuedMine ? "Na fila" : active ? "Parar" : "Minerar"}
                      </Button>
                    </div>
                  </div>

                  {active || (swing.id === ore.id && swing.beat > 0) ? (
                    <div className="pt-2">
                      <Bar
                        label={active ? "Minerando..." : "Pausado"}
                        current={swing.beat}
                        maximum={MINING_TICKS}
                        wraps
                      />
                    </div>
                  ) : null}
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
                const queuedForge = pending?.kind === "forge" && pending.id === row.item.id;

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
                        variant={queuedForge ? "secondary" : entry.canForge ? "primary" : "outline"}
                        disabled={queuedForge ? false : !entry.canForge || activeItem !== null}
                        onClick={() =>
                          queuedForge ? queueSwitch(null) : setConfirmingItem(row.item.id)
                        }
                        aria-label={
                          (queuedForge ? "Cancelar fila de forja de " : "Forjar ") + entry.item.name
                        }
                      >
                        {queuedForge
                          ? "Na fila"
                          : activeItem === row.item.id
                            ? "Forjando..."
                            : "Forjar"}
                      </Button>
                    </div>

                    {(activeItem === row.item.id && strike.id === row.item.id) ||
                    waitingItem === row.item.id ||
                    entry.reason ? (
                      <div className="space-y-1 pt-2">
                        {activeItem === row.item.id && strike.id === row.item.id ? (
                          <Bar
                            label="Forjando..."
                            current={strike.beat}
                            maximum={FORGE_TICKS}
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
          if (confirming) {
            const next: Activity = { kind: "forge", id: confirming.item.id };
            // Busy at the pick: wait for the running swing to land, then forge.
            if (activeOre !== null || activeItem !== null) {
              queueSwitch(next);
            } else {
              // The effect seeds the beat from the bank on mount, so just start it.
              setActivity(next);
            }
          }
          setConfirmingItem(null);
        }}
      />
    </>
  );
}
