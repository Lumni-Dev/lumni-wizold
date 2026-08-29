"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { listForge, listMining } from "@/controllers/forge.controller";
import { usePageActivity } from "@/controllers/use-page-activity";
import { playSound } from "@/controllers/sound";
import { SLOT_LABEL, type EquipmentSlot } from "@/models/entities/item";
import { enhancedName, forgeDurationMs } from "@/models/rules/forge";
import {
  FORGE_TICKS,
  MAX_ENHANCEMENT,
  MINING_TICK_MS,
  MINING_TICKS,
} from "@/shared/constants/game";
import { formatNumber } from "@/shared/utils/format";
import { Bar } from "../components/bar";
import { Button } from "../components/button";
import { ConfirmDialog } from "../components/confirm-dialog";
import { IconFrame } from "../components/icon-frame";
import { ItemIcon } from "../components/item-icon";
import { List, ListRow, RowText } from "../components/list";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
import { PageHeader } from "../layout/page-header";

export function ForgeScreen() {
  const { state, character, mine, enhance, activity, setActivity } = useGame();
  usePageActivity(["mine", "forge"]);
  const paused = activity?.paused === true;
  const activeOre = activity?.kind === "mine" && !paused ? (activity.id ?? null) : null;
  const activeSlot = activity?.kind === "forge" && !paused ? (activity.id ?? null) : null;
  const waitingOre = activity?.kind === "mine" && paused ? (activity.id ?? null) : null;
  const waitingSlot = activity?.kind === "forge" && paused ? (activity.id ?? null) : null;

  const mining = useMemo(() => listMining(state), [state]);
  const slots = useMemo(() => listForge(state), [state]);

  const autoRef = useRef(state.automation);
  const mineRef = useRef(mine);
  const enhanceRef = useRef(enhance);
  useEffect(() => {
    autoRef.current = state.automation;
    mineRef.current = mine;
    enhanceRef.current = enhance;
  });

  const [forging, setForging] = useState<{ beat: number; tickMs: number } | null>(null);

  const [confirmingSlot, setConfirmingSlot] = useState<EquipmentSlot | null>(null);

  useEffect(() => {
    if (!activeSlot || !forging) return;

    const timer = window.setTimeout(() => {
      const beat = forging.beat + 1;
      playSound("forge");
      if (beat >= FORGE_TICKS) {
        void enhanceRef.current(activeSlot as EquipmentSlot);
        setForging(null);
        setActivity(autoRef.current.forge ? { kind: "forge", id: activeSlot, paused: true } : null);
      } else {
        setForging({ ...forging, beat });
      }
    }, forging.tickMs);

    return () => window.clearTimeout(timer);
  }, [activeSlot, forging, setActivity]);

  const pendingLevel = activeSlot
    ? (slots.find((entry) => entry.slot === activeSlot)?.level ?? 0)
    : 0;
  useEffect(() => {
    if (!activeSlot || forging) return;

    const timer = window.setTimeout(
      () => {
        playSound("forge");
        setForging({ beat: 1, tickMs: forgeDurationMs(pendingLevel) / FORGE_TICKS });
      },
      forgeDurationMs(pendingLevel) / FORGE_TICKS,
    );

    return () => window.clearTimeout(timer);
  }, [activeSlot, forging, pendingLevel]);

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
        action={<Tag tone="neutral">Mineração NV. {formatNumber(mining.level)}</Tag>}
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
            {mining.ores.map(({ ore, fragment, owned, unlocked, reason }) => {
              const active = activeOre === ore.id;
              const available = unlocked;

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
                            : (reason ??
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
            {slots.map((entry) => {
              const maxed = entry.level >= MAX_ENHANCEMENT;

              return (
                <ListRow key={entry.slot} layout="column" padding="art">
                  <div className="flex items-center gap-3">
                    {entry.item ? <ItemIcon item={entry.item} /> : <IconFrame>--</IconFrame>}
                    {entry.item ? (
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">
                          {enhancedName(entry.item.name, entry.level)}
                        </p>
                        {entry.fragment && !maxed ? (
                          <p className="font-mono text-[11px] text-ink-soft">
                            {formatNumber(entry.owned)} / {formatNumber(entry.cost)}{" "}
                            {entry.fragment.name}
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

                  {(activeSlot === entry.slot && forging) ||
                  waitingSlot === entry.slot ||
                  entry.reason ? (
                    <div className="space-y-1 pt-2">
                      {activeSlot === entry.slot && forging ? (
                        <Bar
                          label="Forjando..."
                          current={forging.beat}
                          maximum={FORGE_TICKS}
                          wraps
                        />
                      ) : null}
                      {waitingSlot === entry.slot ? (
                        <p className="text-[11px] text-ink-faint">
                          Esperando fragmentos para a próxima martelada
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
        description="A bigorna consome os fragmentos na hora, e marteladas não se desfazem."
        detail={
          confirming && confirming.item && confirming.fragment
            ? enhancedName(confirming.item.name, confirming.level) +
              " → +" +
              formatNumber(confirming.level + 1) +
              " - custa " +
              formatNumber(confirming.cost) +
              " " +
              confirming.fragment.name
            : undefined
        }
        confirmLabel="Forjar"
        onCancel={() => setConfirmingSlot(null)}
        onConfirm={() => {
          if (confirming) {
            setForging({ beat: 0, tickMs: forgeDurationMs(confirming.level) / FORGE_TICKS });
            setActivity({ kind: "forge", id: confirming.slot });
          }
          setConfirmingSlot(null);
        }}
      />
    </>
  );
}
