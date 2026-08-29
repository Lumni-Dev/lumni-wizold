"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useArt } from "@/controllers/art.context";
import { useGame } from "@/controllers/game.context";
import { listTerritories, type HuntReport } from "@/controllers/hunt.controller";
import { usePageActivity } from "@/controllers/use-page-activity";
import { playSound } from "@/controllers/sound";
import { petLevelOf, petMaxEnergy } from "@/models/rules/pet";
import { emphasizeDamage, narrationOf, type NarrationLine } from "../presenters/hunt.presenter";
import { SPECIES_LABEL } from "@/models/entities/creature";
import { DANGER_LABEL } from "@/models/entities/territory";
import { isPetHunting } from "@/models/rules/pet";
import { HUNT_TICK_MS, HUNT_TICKS } from "@/shared/constants/game";
import { cn } from "@/shared/utils/class-names";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { ArtImage } from "../components/art-image";
import { Bar } from "../components/bar";
import { Button } from "../components/button";
import { Card, CardFooter, CardHeader } from "../components/card";
import { Tag } from "../components/tag";
import { DataRow } from "../components/data-row";
import { List, ListRow } from "../components/list";
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
function CombatReport({ report }: { report: HuntReport }) {
  const { combat, creature, territory } = report;
  const outcome = combat.victory ? "Vitória" : combat.retreated ? "Recuo" : "Derrota";
  return (
    <Panel
      title="Última caçada"
      description={territory.name + " - " + creature.name + " (NV. " + creature.level + ")"}
      action={<Tag tone={combat.victory ? "light" : "neutral"}>{outcome}</Tag>}
      padding="none"
    >
      <div className="grid items-start border-b border-edge sm:grid-cols-2 sm:divide-x sm:divide-edge">
        <List>
          <DataRow label="Experiência" value={"+" + formatNumber(report.experience)} />
          <DataRow label="Bronze" value={"+" + formatNumber(report.bronze)} />
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
        {combat.rounds.map((round) => (
          <ListRow key={round.index} className="items-start text-xs leading-relaxed">
            <span className="mt-1 font-mono text-[10px] text-ink-faint">
              {round.index.toString().padStart(2, "0")}
            </span>
            <span className={cn(round.author === "character" ? "text-ink-soft" : "text-ink-faint")}>
              {round.text}
            </span>
          </ListRow>
        ))}
      </List>
    </Panel>
  );
}
export function HuntScreen() {
  const {
    state,
    character,
    pet,
    hunt,
    sufferBlow,
    landHunt,
    notify,
    toggleForm,
    activity,
    setActivity,
  } = useGame();
  usePageActivity(["hunt"]);
  const art = useArt();
  const paused = activity?.paused === true;
  const activeId = activity?.kind === "hunt" && !paused ? (activity.id ?? null) : null;
  const waitingId = activity?.kind === "hunt" && paused ? (activity.id ?? null) : null;
  const petAlong = isPetHunting(pet) ? pet : null;
  const [report, setReport] = useState<HuntReport | null>(null);
  const [session, setSession] = useState<HuntSession>(EMPTY_SESSION);
  const [progress, setProgress] = useState<{
    id: string;
    beat: number;
  }>({ id: "", beat: 0 });
  const beatRef = useRef(0);
  const [pending, setPending] = useState<HuntReport | null>(null);
  const pendingRef = useRef<HuntReport | null>(null);
  const requestingRef = useRef(false);
  const bledRef = useRef({ last: 0, total: 0 });
  const territories = useMemo(() => listTerritories(state), [state]);
  const [script, setScript] = useState<NarrationLine[]>([]);
  const scriptRef = useRef<NarrationLine[]>([]);
  const autoRef = useRef(state.automation.hunt);
  const huntRef = useRef(hunt);
  const sufferRef = useRef(sufferBlow);
  const landRef = useRef(landHunt);
  const notifyRef = useRef(notify);
  const stateRef = useRef(state);
  const nameRef = useRef("");
  useEffect(() => {
    autoRef.current = state.automation.hunt;
    huntRef.current = hunt;
    sufferRef.current = sufferBlow;
    landRef.current = landHunt;
    notifyRef.current = notify;
    stateRef.current = state;
    nameRef.current = character?.name ?? "";
  });
  useEffect(() => {
    if (!activeId) return;
    const timer = window.setInterval(() => {
      const told = scriptRef.current.length;
      const lap = told > 0 ? told + 1 : HUNT_TICKS;
      beatRef.current = beatRef.current >= lap ? 0 : beatRef.current + 1;
      setProgress({ id: activeId, beat: beatRef.current });
      if (beatRef.current === 1 && !pendingRef.current && !requestingRef.current) {
        requestingRef.current = true;
        void huntRef.current(activeId).then((fight) => {
          requestingRef.current = false;
          if (!fight) {
            beatRef.current = 0;
            scriptRef.current = [];
            setScript([]);
            setProgress({ id: activeId, beat: 0 });
            setActivity(autoRef.current ? { kind: "hunt", id: activeId, paused: true } : null);
            return;
          }
          pendingRef.current = fight;
          bledRef.current = { last: stateRef.current.character?.health ?? 0, total: 0 };
          scriptRef.current = narrationOf(
            { foe: fight.creature, combat: fight.combat },
            HUNT_TICKS,
            nameRef.current,
          );
          beatRef.current = Math.min(beatRef.current, 1);
          setScript(scriptRef.current);
          setPending(fight);
        });
      }
      const line = pendingRef.current
        ? scriptRef.current[Math.min(beatRef.current, scriptRef.current.length) - 1]
        : null;
      if (line?.blow === "ours") playSound(line.critical ? "crit" : "hit");
      if (line?.blow === "pet") playSound("snap");
      if (line?.blow === "theirs") playSound("hurt");
      if (pendingRef.current && line?.characterHealth !== undefined) {
        const delta = bledRef.current.last - line.characterHealth;
        if (delta > 0) {
          sufferRef.current(delta);
          bledRef.current = {
            last: line.characterHealth,
            total: bledRef.current.total + delta,
          };
        }
      }
      if (beatRef.current === scriptRef.current.length + 1 && pendingRef.current) {
        const held = pendingRef.current;
        pendingRef.current = null;
        setPending(null);
        landRef.current();
        setReport(held);
        setSession((current) => accumulate(current, held));
        if (held.combat.victory) {
          const spoils = held.drops
            .map((drop) => drop.name + (drop.quantity > 1 ? " x" + drop.quantity : ""))
            .join(", ");
          notifyRef.current(
            held.creature.name +
              " abatido: +" +
              formatNumber(held.bronze) +
              " de bronze e +" +
              formatNumber(held.experience) +
              " de experiência." +
              (spoils ? " Espólio: " + spoils + "." : "") +
              (held.levelsGained > 0 ? " Você subiu de nível!" : ""),
            true,
            "Caça",
          );
        } else if (held.combat.retreated) {
          notifyRef.current(
            "A caçada com " + held.creature.name + " se arrastou e os dois recuaram.",
            true,
            "Caça",
          );
        } else {
          notifyRef.current(
            held.creature.name + " levou a melhor: a caçada não pagou nada.",
            false,
            "Caça",
          );
        }
        if (!held.combat.victory && !held.combat.retreated) playSound("defeat");
        if (!autoRef.current) {
          beatRef.current = 0;
          scriptRef.current = [];
          setScript([]);
          setProgress({ id: activeId, beat: 0 });
          setActivity(null);
        }
      }
    }, HUNT_TICK_MS);
    return () => {
      window.clearInterval(timer);
      if (pendingRef.current) {
        pendingRef.current = null;
        setPending(null);
        landRef.current();
        beatRef.current = 0;
        scriptRef.current = [];
        setScript([]);
        setProgress((current) => ({ ...current, beat: 0 }));
      }
    };
  }, [activeId, setActivity]);
  if (!character) return null;
  const drops = Object.entries(session.drops);
  function toggleHunt(territoryId: string, available: boolean) {
    beatRef.current = 0;
    scriptRef.current = [];
    setScript([]);
    setProgress({ id: territoryId, beat: 0 });
    if (activeId === territoryId) {
      setActivity(null);
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
        description={
          state.automation.hunt
            ? "A caçada roda sozinha: a barra enche, o combate resolve e o loot cai. Ela só para quando você mandar parar."
            : "A caçada roda sozinha: a barra enche, o combate resolve e o loot cai. Cada clique vale uma luta; ligue a caçada automática nas configurações para encadear."
        }
        action={
          <div className="flex items-center gap-2">
            {pet ? (
              <Tag tone="neutral">
                {petAlong
                  ? "Mascote acompanhando"
                  : pet.energy <= 0
                    ? "Mascote sem fôlego"
                    : "Mascote em casa"}
              </Tag>
            ) : null}
            <Tag tone="neutral">{formatBronze(character.bronze)}</Tag>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {territories.map(
          ({ territory, creatures, prey, unlocked, hasHealth, transformed, reason }) => {
            const ready = unlocked && hasHealth;
            const available = ready && transformed;
            const active = activeId === territory.id;
            const line =
              active && script.length > 0
                ? script[
                    (progress.beat === 0 ? script.length : Math.min(progress.beat, script.length)) -
                      1
                  ]
                : null;
            const foe = pending ?? report;
            const shownPrey = line && foe ? foe.creature : prey;
            const shownHealth =
              line && foe ? line.creatureHealth : unlocked ? (prey?.health ?? 0) : 0;
            const fightingId = line && foe ? foe.creature.id : null;
            return (
              <Card
                key={territory.id}
                height="fill"
                interactive={available}
                tone={active ? "highlighted" : "default"}
                className={cn(!available && !active && "opacity-70")}
              >
                {art.territories[territory.id] ? (
                  <div className="aspect-video w-full overflow-hidden border-b border-edge">
                    <ArtImage source={art.territories[territory.id]} />
                  </div>
                ) : null}
                <CardHeader>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm text-ink">{territory.name}</h2>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      {SPECIES_LABEL[territory.species]} - {DANGER_LABEL[territory.danger]}
                    </p>
                  </div>
                </CardHeader>

                <div className="flex flex-1 flex-col divide-y divide-edge">
                  <div className="space-y-2 px-4 py-3">
                    <p className="text-xs leading-relaxed text-ink-faint">
                      {territory.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Tag tone="neutral">
                        NV. {formatNumber(territory.minLevel)} a {formatNumber(territory.maxLevel)}
                      </Tag>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      Criaturas avistadas
                    </p>
                    <ul className="space-y-1">
                      {creatures.map((creature) => (
                        <li
                          key={creature.id}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span
                            className={cn(
                              creature.id === fightingId || creature.id === prey?.id
                                ? "text-ember"
                                : character.level >= creature.level
                                  ? "text-ink-soft"
                                  : "text-ink-faint",
                            )}
                          >
                            {creature.name}
                          </span>
                          <span
                            className={cn(
                              "font-mono text-[11px]",
                              creature.id === fightingId || creature.id === prey?.id
                                ? "text-ember"
                                : "text-ink-faint",
                            )}
                          >
                            NV. {formatNumber(creature.level)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {shownPrey ? (
                    <div className="px-4 py-3">
                      <Bar
                        label={shownPrey.name}
                        current={shownHealth}
                        maximum={shownPrey.health}
                        tone={shownHealth > shownPrey.health / 2 ? "blood" : "ember"}
                      />
                    </div>
                  ) : null}

                  <div className="px-4 py-3">
                    <Bar
                      label="Caçada"
                      current={
                        progress.id === territory.id
                          ? Math.min(progress.beat, script.length || HUNT_TICKS)
                          : 0
                      }
                      maximum={
                        progress.id === territory.id ? script.length || HUNT_TICKS : HUNT_TICKS
                      }
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
                </div>

                <CardFooter>
                  <span className="text-[11px] text-ink-faint">
                    {active
                      ? petAlong
                        ? "Caçando com o mascote..."
                        : state.automation.hunt
                          ? "Caçando sem parar..."
                          : "Caçando..."
                      : waitingId === territory.id
                        ? "Esperando o corpo para voltar a caçar"
                        : (reason ?? "Trilha liberada")}
                  </span>
                  {ready && !transformed && !active ? (
                    <Button variant="primary" onClick={toggleForm}>
                      Transformar
                    </Button>
                  ) : (
                    <Button
                      variant={active ? "secondary" : available ? "primary" : "outline"}
                      onClick={() => toggleHunt(territory.id, available)}
                      disabled={!available && !active}
                    >
                      {active ? "Parar" : "Caçar"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          },
        )}
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
          <div className="grid divide-y divide-edge sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <List>
              <DataRow label="Caçadas" value={formatNumber(session.hunts)} />
              <DataRow label="Vitórias" value={formatNumber(session.wins)} />
              <DataRow label="Derrotas" value={formatNumber(session.losses)} />
              {session.retreats > 0 ? (
                <DataRow label="Recuos" value={formatNumber(session.retreats)} />
              ) : null}
              <DataRow label="Bronze" value={"+" + formatNumber(session.bronze)} />
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
        <CombatReport report={report} />
      ) : (
        <EmptyState
          title="Nenhuma caçada nesta sessão"
          description="Escolha um território e a caça começa a rodar sozinha, ciclo após ciclo."
        />
      )}
    </>
  );
}
