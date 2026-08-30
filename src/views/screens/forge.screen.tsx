"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { listForge, listMining, type ForgeSlot } from "@/controllers/forge.controller";
import { usePageActivity } from "@/controllers/use-page-activity";
import { playSound } from "@/controllers/sound";
import { SLOT_LABEL, type EquipmentSlot } from "@/models/entities/item";
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
  const activeSlot = activity?.kind === "forge" && !paused ? (activity.id ?? null) : null;
  const waitingOre = activity?.kind === "mine" && paused ? (activity.id ?? null) : null;
  const waitingSlot = activity?.kind === "forge" && paused ? (activity.id ?? null) : null;

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
  const paidRef = useRef(false);
  const landedRef = useRef<{ message: string; raised: boolean } | null>(null);
  const [heldSlot, setHeldSlot] = useState<ForgeSlot | null>(null);

  const [confirmingSlot, setConfirmingSlot] = useState<EquipmentSlot | null>(null);

  useEffect(() => {
    if (!activeSlot) return;

    const level = slotsRef.current.find((entry) => entry.slot === activeSlot)?.level ?? 0;
    const tickMs = forgeDurationMs(level) / FORGE_TICKS;
    const timer = window.setInterval(() => {
      strikeRef.current = strikeRef.current >= FORGE_TICKS ? 0 : strikeRef.current + 1;
      setStrike({ id: activeSlot, beat: strikeRef.current });

      if (strikeRef.current === 1) {
        paidRef.current = false;
        landedRef.current = null;
        setHeldSlot(slotsRef.current.find((entry) => entry.slot === activeSlot) ?? null);
        void enhanceRef.current(activeSlot as EquipmentSlot).then((landed) => {
          if (landed) {
            paidRef.current = true;
            landedRef.current = landed;
            playSound("buy");
            return;
          }
          strikeRef.current = 0;
          setStrike({ id: activeSlot, beat: 0 });
          setHeldSlot(null);
          setActivity(
            autoRef.current.forge ? { kind: "forge", id: activeSlot, paused: true } : null,
          );
        });
      } else if (strikeRef.current > 1 && strikeRef.current < FORGE_TICKS && paidRef.current) {
        playSound("forge");
      }

      if (strikeRef.current < FORGE_TICKS) return;
      setHeldSlot(null);
      const landed = landedRef.current;
      landedRef.current = null;
      if (landed) {
        if (landed.message) notifyRef.current(landed.message, true, "Bigorna");
        playSound(landed.raised ? "point" : "denied");
      }
      if (!autoRef.current.forge) {
        strikeRef.current = 0;
        setStrike({ id: activeSlot, beat: 0 });
        setActivity(null);
      }
    }, tickMs);

    return () => window.clearInterval(timer);
  }, [activeSlot, setActivity]);

  const [swing, setSwing] = useState<{ id: string; beat: number }>({ id: "", beat: 0 });
  const swingRef = useRef(0);

  useEffect(() => {
    if (!activeOre) return;

    const timer = window.setInterval(() => {
      swingRef.current = swingRef.current >= MINING_TICKS ? 0 : swingRef.current + 1;
      setSwing({ id: activeOre, beat: swingRef.current });

      if (swingRef.current > 0) playSound("mine");

      if (swingRef.current < MINING_TICKS) return;
      void mineRef.current(activeOre).then((mined) => {
        if (!mined) {
          swingRef.current = 0;
          setSwing({ id: activeOre, beat: 0 });
          setActivity(autoRef.current.mine ? { kind: "mine", id: activeOre, paused: true } : null);
          return;
        }
        if (!autoRef.current.mine) {
          swingRef.current = 0;
          setSwing({ id: activeOre, beat: 0 });
          setActivity(null);
        }
      });
    }, MINING_TICK_MS);

    return () => window.clearInterval(timer);
  }, [activeOre, setActivity]);

  if (!character) return null;

  const confirming = confirmingSlot
    ? (slots.find((entry) => entry.slot === confirmingSlot) ?? null)
    : null;

  function toggleMining(oreId: string, available: boolean) {
    swingRef.current = 0;
    setSwing({ id: oreId, beat: 0 });

    if (activeOre === oreId) {
      setActivity(null);
      return;
    }
    if (!available) return;

    setActivity({ kind: "mine", id: oreId });
  }

  return (
    <>
      <PageHeader
        title="Forja"
        description="A bigorna não faz peça nova: ela bate de novo na que você já usa, e o que alimenta a marreta sai da rocha."
        action={
          <div className="flex items-center gap-2">
            <Tag tone="neutral">Mineração NV. {formatNumber(mining.level)}</Tag>
            <Tag tone="neutral">{formatBronze(character.bronze)}</Tag>
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
                        variant={active ? "secondary" : available ? "primary" : "outline"}
                        disabled={!available && !active}
                        onClick={() => toggleMining(ore.id, available)}
                        aria-label={(active ? "Parar de minerar " : "Minerar ") + ore.label}
                      >
                        {active ? "Parar" : "Minerar"}
                      </Button>
                    </div>
                  </div>

                  {active || (swing.id === ore.id && swing.beat > 0) ? (
                    <div className="pt-2">
                      <Bar
                        label="Minerando..."
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
            "Cada nível soma um ponto de força ou resistência mais 0,2% da peça original, até +" +
            formatNumber(MAX_ENHANCEMENT) +
            "."
          }
          padding="none"
        >
          <List>
            {slots.map((row) => {
              const entry = activeSlot === row.slot && heldSlot?.slot === row.slot ? heldSlot : row;
              const maxed = entry.level >= MAX_ENHANCEMENT;

              return (
                <ListRow key={entry.slot} layout="column" padding="art">
                  <div className="flex items-center gap-3">
                    {entry.item ? (
                      <ItemIcon item={entry.item} enhancement={entry.level} />
                    ) : (
                      <IconFrame>--</IconFrame>
                    )}
                    {entry.item ? (
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
                    ) : (
                      <RowText title="Nada equipado" description={SLOT_LABEL[entry.slot]} />
                    )}
                    <Button
                      variant={entry.canForge ? "primary" : "outline"}
                      disabled={!entry.canForge || activeSlot !== null}
                      onClick={() => setConfirmingSlot(entry.slot)}
                      aria-label={"Forjar " + SLOT_LABEL[entry.slot]}
                    >
                      {activeSlot === entry.slot ? "Forjando..." : "Forjar"}
                    </Button>
                  </div>

                  {(activeSlot === entry.slot && strike.id === entry.slot) ||
                  waitingSlot === entry.slot ||
                  entry.reason ? (
                    <div className="space-y-1 pt-2">
                      {activeSlot === entry.slot && strike.id === entry.slot ? (
                        <Bar
                          label={strike.beat === 1 ? "Cobrando..." : "Forjando..."}
                          current={strike.beat}
                          maximum={FORGE_TICKS}
                          wraps
                        />
                      ) : null}
                      {waitingSlot === entry.slot ? (
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
            })}
          </List>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirming !== null && confirming.item !== null}
        title="Forjar"
        description="A bigorna consome os fragmentos e o bronze na hora, e marteladas não se desfazem."
        detail={
          confirming && confirming.item && confirming.fragment
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
        onCancel={() => setConfirmingSlot(null)}
        onConfirm={() => {
          if (confirming) {
            strikeRef.current = 0;
            paidRef.current = false;
            landedRef.current = null;
            setStrike({ id: confirming.slot, beat: 0 });
            setHeldSlot(null);
            setActivity({ kind: "forge", id: confirming.slot });
          }
          setConfirmingSlot(null);
        }}
      />
    </>
  );
}
