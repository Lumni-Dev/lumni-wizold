"use client";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useArt } from "@/controllers/art.context";
import { activityRuntimeStore } from "@/controllers/activity-runtime";
import { useGame } from "@/controllers/game.context";
import {
  listTerritories,
  normalizeHuntSelection,
  resolveHuntCreatureId,
  type HuntReport,
} from "@/controllers/hunt.controller";
import { ACTIVITY_WAIT_LABEL, useActivityLock } from "@/controllers/use-activity-lock";
import { areaVoice, useNarration } from "@/controllers/use-narration";
import { usePageActivity } from "@/controllers/use-page-activity";
import { emphasizeDamage, narrationOf, type NarrationLine } from "../presenters/hunt.presenter";
import { DANGER_LABEL } from "@/models/entities/territory";
import { canPetFight, isPetActive, petLevelOf, petMaxEnergy } from "@/models/rules/pet";
import { cn } from "@/shared/utils/class-names";
import { formatNumber } from "@/shared/utils/format";
import { backgroundRepository } from "@/models/repositories/background.repository";
import { ArtImage } from "../components/art-image";
import { ArtVideo } from "../components/art-video";
import { ChipTabs } from "../components/chip-tabs";
import { NarrationButton } from "../components/narration-button";
import { CreatureIcon } from "../components/creature-icon";
import {
  loadHuntSelection,
  saveHuntSelection,
} from "@/models/repositories/hunt-selection.repository";
import { Bar } from "../components/bar";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { useShake } from "../components/use-shake";
import { Tag } from "../components/tag";
import { DataRow } from "../components/data-row";
import { ArtRowButton, List, ListRow } from "../components/list";
import { Panel } from "../components/panel";
import { EmptyState } from "../components/empty-state";
import { PageHeader } from "../layout/page-header";
interface HuntSession {
  hunts: number;
  wins: number;
  losses: number;
  retreats: number;
  bronze: number;
  experience: number;
  drops: Record<
    string,
    {
      name: string;
      quantity: number;
    }
  >;
}
const EMPTY_SESSION: HuntSession = {
  hunts: 0,
  wins: 0,
  losses: 0,
  retreats: 0,
  bronze: 0,
  experience: 0,
  drops: {},
};
function accumulate(session: HuntSession, report: HuntReport): HuntSession {
  const drops = { ...session.drops };
  for (const drop of report.drops) {
    const current = drops[drop.itemId];
    drops[drop.itemId] = {
      name: drop.name,
      quantity: (current?.quantity ?? 0) + drop.quantity,
    };
  }
  const lost = !report.combat.victory && !report.combat.retreated;
  return {
    hunts: session.hunts + 1,
    wins: session.wins + (report.combat.victory ? 1 : 0),
    losses: session.losses + (lost ? 1 : 0),
    retreats: session.retreats + (report.combat.retreated ? 1 : 0),
    bronze: session.bronze + report.bronze,
    experience: session.experience + report.experience,
    drops,
  };
}
function CombatReport({ report, lines }: { report: HuntReport; lines: NarrationLine[] }) {
  const { combat, creature, territory } = report;
  const outcome = combat.victory ? "Vitória" : combat.retreated ? "Recuo" : "Derrota";
  return (
    <Panel
      title="Última caçada"
      description={territory.name + " - " + creature.name + " (NV. " + creature.level + ")"}
      action={<Tag tone={combat.victory ? "light" : "neutral"}>{outcome}</Tag>}
      padding="none"
    >
      <div className="grid grid-cols-1 items-start border-b border-edge sm:grid-cols-2 sm:divide-x sm:divide-edge">
        <List>
          <DataRow label="Experiência" value={"+" + formatNumber(report.experience)} />
          <DataRow label="WCoins" value={"+" + formatNumber(report.bronze)} />
          <DataRow label="Dano causado" value={formatNumber(combat.damageDealt)} />
          <DataRow label="Dano recebido" value={formatNumber(combat.damageTaken)} />
          {report.petEffort > 0 ? (
            <DataRow label="Experiência do mascote" value={"+" + formatNumber(report.petEffort)} />
          ) : null}
          {combat.petBlows > 0 ? (
            <DataRow label="Botes do mascote" value={formatNumber(combat.petBlows)} />
          ) : null}
          {combat.petSpent > 0 ? (
            <DataRow label="Energia do mascote" value={"-" + formatNumber(combat.petSpent)} />
          ) : null}
        </List>
        <div className="space-y-2 p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">Loot</p>
          {report.drops.length === 0 ? (
            <p className="text-xs text-ink-faint">A carcaça não rendeu nada aproveitável.</p>
          ) : (
            <ul className="space-y-2">
              {report.drops.map((drop) => (
                <li key={drop.itemId} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-ink-soft">{drop.name}</span>
                  <span className="font-mono text-ink-faint">x{drop.quantity}</span>
                </li>
              ))}
            </ul>
          )}
          {report.levelsGained > 0 ? (
            <p className="text-xs text-ink">
              Você subiu {report.levelsGained} nível(is) nesta caçada.
            </p>
          ) : null}
          {report.petLeveled ? (
            <p className="text-xs text-ink">O lobo subiu de nível nesta caçada.</p>
          ) : null}
        </div>
      </div>

      <List className="max-h-64 overflow-y-auto">
        {lines.map((line, index) => (
          <ListRow key={index} className="text-xs leading-relaxed">
            <span className="font-mono text-[10px] text-ink-faint">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className={cn(
                line.blow === "ours" || line.blow === "pet" ? "text-ink-soft" : "text-ink-faint",
              )}
            >
              {line.text}
            </span>
          </ListRow>
        ))}
      </List>
    </Panel>
  );
}
export function HuntScreen() {
  const { state, character, pet, moon, activity, setActivity } = useGame();
  usePageActivity(["hunt"]);
  const { locked } = useActivityLock();
  const waitLabel = locked ? ACTIVITY_WAIT_LABEL : "";
  const narration = useNarration();
  const runtime = useSyncExternalStore(
    activityRuntimeStore.subscribe,
    activityRuntimeStore.snapshot,
    activityRuntimeStore.serverSnapshot,
  );
  const huntRt = runtime.hunt;
  const paused = activity?.paused === true;
  const activeId = activity?.kind === "hunt" && !paused ? (activity.id ?? null) : null;
  const waitingId = activity?.kind === "hunt" && paused ? (activity.id ?? null) : null;
  const progress =
    huntRt && activeId === huntRt.territoryId
      ? { id: huntRt.territoryId, beat: huntRt.beat }
      : { id: activeId ?? "", beat: 0 };
  const script = huntRt && activeId === huntRt.territoryId ? huntRt.script : [];
  const pending = huntRt && activeId === huntRt.territoryId ? huntRt.pending : null;
  const cooldown = huntRt && activeId === huntRt.territoryId ? huntRt.cooldown : null;
  const art = useArt();
  const petAlong = canPetFight(pet) ? pet : null;
  const [report, setReport] = useState<HuntReport | null>(null);
  const [selection, setSelection] = useState<Record<string, string>>(() => loadHuntSelection());
  const [reportLines, setReportLines] = useState<NarrationLine[]>([]);
  const [session, setSession] = useState<HuntSession>(EMPTY_SESSION);
  const [preyJolt, setPreyJolt] = useState(0);
  const [area, setArea] = useState("all");
  const [lapJolt, setLapJolt] = useState(0);
  const shaking = useShake(preyJolt + lapJolt);
  const lastReportRef = useRef<HuntReport | null>(null);
  const territories = useMemo(() => listTerritories(state), [state]);
  const areaTabs = useMemo(
    () => [
      { key: "all", label: "Todas" },
      ...territories.map(({ territory }) => ({ key: territory.id, label: territory.name })),
    ],
    [territories],
  );
  const shownAreas =
    area === "all"
      ? territories
      : territories.filter(
          ({ territory }) =>
            territory.id === area || territory.id === activeId || territory.id === waitingId,
        );
  const xpBonus = moon.phase.experienceBonus;
  const animatedArt = useSyncExternalStore(
    backgroundRepository.subscribe,
    backgroundRepository.enabled,
    backgroundRepository.serverSnapshot,
  );

  useEffect(() => {
    const landed = runtime.lastHuntReport;
    if (!landed || landed === lastReportRef.current) return;
    lastReportRef.current = landed;
    setReport(landed);
    setReportLines(narrationOf({ foe: landed.creature, combat: landed.combat }));
    setSession((current) => accumulate(current, landed));
  }, [runtime.lastHuntReport]);

  const effectiveSelection = useMemo(
    () => normalizeHuntSelection(state, selection),
    [state, selection],
  );
  const scrollDataRef = useRef({ territories, effectiveSelection });
  useEffect(() => {
    scrollDataRef.current = { territories, effectiveSelection };
  });

  useEffect(() => {
    if (!activeId) return;
    const { territories: rows, effectiveSelection: chosen } = scrollDataRef.current;
    const row = rows.find((entry) => entry.territory.id === activeId);
    if (!row) return;
    const wanted = resolveHuntCreatureId(row.creatures, chosen[activeId]);
    const index = row.creatures.findIndex((creature) => creature.id === wanted);
    if (index < 0) return;
    const list = document.querySelector<HTMLElement>(
      '[data-hunt-list="' + activeId + '"] ul',
    );
    const target = list?.children[index];
    if (!list || !(target instanceof HTMLElement)) return;
    const listTop = list.getBoundingClientRect().top;
    const rect = target.getBoundingClientRect();
    const centred = rect.top - listTop - (list.clientHeight - rect.height) / 2;
    list.scrollTo({ top: list.scrollTop + centred, behavior: "smooth" });
  }, [activeId]);

  useEffect(() => {
    if (!huntRt || !activeId || huntRt.territoryId !== activeId || huntRt.beat <= 0) return;
    const line = huntRt.script[Math.min(huntRt.beat, huntRt.script.length) - 1];
    if (line?.critical) {
      /* eslint-disable react-hooks/set-state-in-effect */
      if (line.blow === "theirs") setLapJolt((count) => count + 1);
      else setPreyJolt((count) => count + 1);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [huntRt, activeId]);

  if (!character) return null;
  const drops = Object.entries(session.drops);
  function selectCreature(territoryId: string, creatureId: string) {
    setSelection((current) => {
      const next = { ...normalizeHuntSelection(state, current), [territoryId]: creatureId };
      saveHuntSelection(next);
      return next;
    });
  }
  function toggleHunt(territoryId: string, available: boolean) {
    if (activeId === territoryId) {
      if (cooldown !== null) setActivity(null);
      return;
    }
    if (!available) return;
    setSession(EMPTY_SESSION);
    setReport(null);
    setActivity({ kind: "hunt", id: territoryId });
  }
  return (
    <>
      <PageHeader
        title="Caça"
        description="A caçada roda sozinha: cada luta toca ao vivo e grava no fim. Não dá para parar no meio de uma luta, mas entre uma e outra sobram três segundos para você mandar parar."
        action={
          pet ? (
            <Tag tone="neutral">
              {petAlong
                ? "Mascote acompanhando"
                : isPetActive(pet)
                  ? "Mascote sem energia"
                  : "Mascote em repouso"}
            </Tag>
          ) : null
        }
      />

      <ChipTabs tabs={areaTabs} value={area} onChange={setArea} />

      <div className="space-y-6">
        {shownAreas.map(({ territory, creatures, prey, unlocked, hasHealth, reason }) => {
          const ready = unlocked && hasHealth;
          const available = ready;
          const active = activeId === territory.id;
          const opting = active && cooldown !== null;
          const selectedId = resolveHuntCreatureId(creatures, effectiveSelection[territory.id]);
          const onThis = active && progress.id === territory.id;
          const line =
            onThis && progress.beat > 0 && script.length > 0
              ? script[Math.min(progress.beat, script.length) - 1]
              : null;
          const replaying = onThis && pending !== null && line !== null;
          const filling = onThis && pending !== null && line === null;
          const foe = pending ?? report;
          const shownFoe =
            (replaying || filling) && foe
              ? foe.creature
              : (creatures.find((creature) => creature.id === selectedId) ?? prey ?? creatures[0]);
          const monsterMax = Math.max(1, shownFoe?.health ?? 1);
          const monsterCurrent =
            replaying && line
              ? Math.max(0, Math.min(monsterMax, line.creatureHealth))
              : filling
                ? monsterMax
                : 0;
          const monsterStatus = replaying ? "Atacando" : filling ? "Preparando" : "Aguardando";
          return (
            <Card
              key={territory.id}
              height="content"
              interactive={available}
              tone={active ? "highlighted" : "default"}
              className={cn(!available && !active && "opacity-70", active && shaking && "card-shake")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-edge">
                <div className="flex flex-col divide-y divide-edge">
                  {art.territories[territory.id] ? (
                    <div className="aspect-video w-full overflow-hidden">
                      {animatedArt && art.territoryVideos[territory.id] ? (
                        <ArtVideo
                          source={art.territoryVideos[territory.id]}
                          poster={art.territories[territory.id]}
                        />
                      ) : (
                        <ArtImage source={art.territories[territory.id]} />
                      )}
                    </div>
                  ) : null}
                  <div className="p-4">
                    <h2 className="text-sm text-ink">{territory.name}</h2>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      {DANGER_LABEL[territory.danger]}
                    </p>
                  </div>
                  <div className="space-y-3 px-4 py-3">
                    <p className="text-xs leading-relaxed text-ink-faint">
                      {territory.description}
                    </p>
                    <NarrationButton
                      playing={narration.current === areaVoice(territory.id)}
                      onClick={() => narration.toggle(areaVoice(territory.id))}
                      label={"Ouvir sobre " + territory.name}
                    />
                  </div>
                  {shownFoe ? (
                    <div className="px-4 py-3">
                      <Bar
                        label={monsterStatus + " · " + shownFoe.name}
                        current={monsterCurrent}
                        maximum={monsterMax}
                        tone="blood"
                      />
                    </div>
                  ) : null}
                  <div className="px-4 py-3">
                    <Bar
                      label={active ? "Caçando..." : "Caçar"}
                      current={onThis ? progress.beat : 0}
                      maximum={Math.max(1, script.length)}
                      glows={active}
                      wraps
                    />
                  </div>
                  {active && petAlong ? (
                    <div className="px-4 py-3">
                      <Bar
                        label="Mascote - Energia"
                        current={petAlong.energy}
                        maximum={petMaxEnergy(petLevelOf(petAlong))}
                        tone="vigor"
                      />
                    </div>
                  ) : null}
                  {line ? (
                    <p
                      className={cn(
                        "truncate px-4 py-3 font-mono text-[11px]",
                        line.critical ? "text-ember" : "text-ink-faint",
                      )}
                    >
                      {emphasizeDamage(line.text).map((part, index) =>
                        typeof part === "string" ? (
                          part
                        ) : (
                          <strong
                            key={index}
                            className={cn("font-bold", !line.critical && "text-ink")}
                          >
                            {part.damage}
                          </strong>
                        ),
                      )}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <span className="text-[11px] text-ink-faint">
                      {active
                        ? opting
                          ? "Pode parar agora ou seguir para a próxima."
                          : state.automation.hunt
                            ? "Caçando sem parar..."
                            : "Caçando..."
                        : waitingId === territory.id
                          ? "Esperando o corpo para voltar a caçar"
                          : (reason ?? "Trilha liberada")}
                    </span>
                    <Button
                      variant={active ? "secondary" : available ? "primary" : "outline"}
                      onClick={() => toggleHunt(territory.id, available)}
                      disabled={active ? !opting : !available || locked}
                    >
                      {opting
                        ? "Parar (" + cooldown + ")"
                        : active
                          ? "Caçando..."
                          : waitLabel || "Caçar"}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col border-t border-edge md:border-t-0">
                  <div className="px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      Criaturas da área
                    </p>
                  </div>
                  <div data-hunt-list={territory.id} className="relative md:flex-1 md:min-h-0">
                    <List className="max-h-[560px] overflow-y-auto border-t border-edge md:absolute md:inset-0 md:max-h-none">
                      {creatures.map((creature) => {
                        const isSelected = creature.id === selectedId;
                        const isPrey = active && creature.id === selectedId;
                        const reached = character.level >= creature.level;
                        return (
                          <ArtRowButton
                            key={creature.id}
                            art={<CreatureIcon creature={creature} />}
                            title={
                              <span
                                className={cn(
                                  isPrey
                                    ? "text-ember"
                                    : reached
                                      ? "text-ink-soft"
                                      : "text-ink-faint",
                                )}
                              >
                                {creature.name}
                              </span>
                            }
                            description={
                              <>
                                <span className="block font-mono">
                                  NV. {formatNumber(creature.level)} a{" "}
                                  {formatNumber(creature.level + 9)}
                                </span>
                                <span className="block font-mono">
                                  {formatNumber(
                                    Math.round(creature.experience * (1 + xpBonus)),
                                  )}{" "}
                                  de experiência
                                  {xpBonus > 0
                                    ? " (+" + Math.round(xpBonus * 100) + "% lua)"
                                    : ""}
                                </span>
                              </>
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
                            onClick={() => selectCreature(territory.id, creature.id)}
                          />
                        );
                      })}
                    </List>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {session.hunts > 0 ? (
        <Panel
          title="Sessão de caça"
          description="Tudo que esta rodada rendeu até agora."
          action={
            activeId ? <Tag tone="light">Em andamento</Tag> : <Tag tone="neutral">Parada</Tag>
          }
          padding="none"
        >
          <div className="grid grid-cols-1 divide-y divide-edge sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <List>
              <DataRow label="Caçadas" value={formatNumber(session.hunts)} />
              <DataRow label="Vitórias" value={formatNumber(session.wins)} />
              <DataRow label="Derrotas" value={formatNumber(session.losses)} />
              {session.retreats > 0 ? (
                <DataRow label="Recuos" value={formatNumber(session.retreats)} />
              ) : null}
              <DataRow label="WCoins" value={"+" + formatNumber(session.bronze)} />
              <DataRow label="Experiência" value={"+" + formatNumber(session.experience)} />
            </List>
            <div className="space-y-2 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                Loot acumulado
              </p>
              {drops.length === 0 ? (
                <p className="text-xs text-ink-faint">Nada aproveitável até agora.</p>
              ) : (
                <ul className="space-y-2">
                  {drops.map(([itemId, drop]) => (
                    <li key={itemId} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-ink-soft">{drop.name}</span>
                      <span className="font-mono text-ink-faint">
                        x{formatNumber(drop.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Panel>
      ) : null}

      {report ? (
        <CombatReport report={report} lines={reportLines} />
      ) : (
        <EmptyState
          title="Nenhuma caçada nesta sessão"
          description="Escolha um território e a caça começa a rodar sozinha, ciclo após ciclo."
        />
      )}
    </>
  );
}
