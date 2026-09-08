"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/controllers/api.client";
import { ACTIVITY_WAIT_LABEL, useActivityLock } from "@/controllers/use-activity-lock";
import { useT } from "@/controllers/use-locale";
import { useGame } from "@/controllers/game.context";
import {
  describeArenaHistory,
  formatCooldown,
  listArena,
  type ArenaResolution,
} from "@/controllers/arena.controller";
import { ARENA_HISTORY_SIZE, type ArenaHistoryEntry } from "@/models/entities/arena";
import { ATTRIBUTES } from "@/models/entities/attribute";
import type { Gender } from "@/models/entities/character";
import type { Hunter } from "@/models/entities/ranking";
import { findItem } from "@/models/data/items";
import { ARENA_DAILY_ATTACKS, arenaCharges, arenaSpoilsRange, arenaStats } from "@/models/rules/arena";
import { extraStrikeChanceExact, EXTRA_STRIKE_CAP } from "@/models/rules/combat";
import { CRITICAL_CHANCE_CAP, DODGE_CHANCE_CAP, type DerivedStats } from "@/models/rules/stats";
import { canPetFight, isPetActive, petLevelOf, petMaxEnergy } from "@/models/rules/pet";
import { playSound } from "@/controllers/sound";
import { HUNT_APPROACH_TICKS, HUNT_TICK_MS } from "@/shared/constants/game";
import { ICON_FRAME_INSET } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { formatDay, formatFraction, formatNumber, formatBronze } from "@/shared/utils/format";
import { clampPage, pageCount, pageOf } from "@/shared/utils/pagination";
import { displayNick } from "@/shared/utils/text";
import { emphasizeDamage, narrationOf, type NarrationLine } from "../presenters/hunt.presenter";
import { Bar } from "../components/bar";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { Button } from "../components/button";
import { DataRow } from "../components/data-row";
import { EmptyState } from "../components/empty-state";
import { HunterSearchField } from "../components/hunter-search-field";
import { GenderArtFill, GenderIcon } from "../components/gender-icon";
import { List, ListRow, RowText } from "../components/list";
import { Pagination } from "../components/pagination";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
import { Tooltip } from "../components/tooltip";
import { useShake } from "../components/use-shake";
import { PageHeader } from "../layout/page-header";
const PAGE_SIZE = 9;
function Fighter({
  gender,
  name,
  level,
  side,
  health,
  maximum,
  lost = 0,
}: {
  gender: Gender;
  name: string;
  level: number;
  side: string;
  health: number;
  maximum: number;
  lost?: number;
}) {
  const left = Math.max(0, Math.round(health));
  return (
    <div className={cn("flex items-center gap-3 p-4", ICON_FRAME_INSET)}>
      <GenderIcon gender={gender} size="medium" />
      <div className="min-w-0 flex-1 space-y-2">
        <RowText title={name} label={side + " - LV. " + formatNumber(level)} />
        <Bar
          label="Health"
          current={left}
          maximum={maximum}
          tone={left > maximum / 2 ? "blood" : "ember"}
          delta={lost > 0 ? "-" + formatNumber(lost) : undefined}
        />
      </div>
    </div>
  );
}
function DuelReport({ report }: { report: ArenaResolution }) {
  const { combat, hunter } = report;
  const t = useT();
  const outcome = combat.victory ? "Victory" : combat.retreated ? "Draw" : "Defeat";
  return (
    <Panel
      title="Last duel"
      description={displayNick(hunter.name) + " (LV. " + formatNumber(hunter.level) + ")"}
      action={<Tag tone="neutral">{outcome}</Tag>}
      padding="none"
    >
      <div className="grid grid-cols-1 items-start border-b border-edge sm:grid-cols-2 sm:divide-x sm:divide-edge">
        <List>
          <DataRow
            label={report.spoils < 0 ? "WCoins lost" : "WCoins taken"}
            value={(report.spoils < 0 ? "-" : "+") + formatNumber(Math.abs(report.spoils))}
          />
          <DataRow label="Damage dealt" value={formatNumber(combat.damageDealt)} />
          <DataRow label="Damage taken" value={formatNumber(combat.damageTaken)} />
        </List>
        <div className="space-y-2 p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">{t("The pit")}</p>
          <p className="text-xs leading-relaxed text-ink-faint">
            {t(
              combat.victory
                ? displayNick(hunter.name) + " stayed on the ground, and the purse is yours."
                : combat.retreated
                  ? "Both held to the end and neither put the other on the ground."
                  : displayNick(hunter.name) + " got the better of it. You leave beaten, but you leave.",
            )}
          </p>
          <p className="text-xs text-ink-faint">
            {t("The pit pays no experience: here WCoins only change hands.")}
          </p>
        </div>
      </div>

      <List className="max-h-64 overflow-y-auto">
        {combat.rounds.map((round) => (
          <ListRow key={round.index} className="text-xs leading-relaxed">
            <span className="font-mono text-[10px] text-ink-faint">
              {round.index.toString().padStart(2, "0")}
            </span>
            <span className={cn(round.author === "character" ? "text-ink-soft" : "text-ink-faint")}>
              {t(round.text)}
            </span>
          </ListRow>
        ))}
      </List>
    </Panel>
  );
}
export function ArenaScreen() {
  const {
    state,
    character,
    stats,
    pet,
    moon,
    drawOpponent,
    challengeArena,
    sufferBlow,
    landArena,
    consumeItem,
    notify,
  } = useGame();
  const { locked, reason: lockReason } = useActivityLock();
  const t = useT();
  const waitLabel = locked ? ACTIVITY_WAIT_LABEL : "";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [roster, setRoster] = useState<Hunter[]>([]);
  const [fighting, setFighting] = useState<{ hunter: Hunter; maxHealth: number } | null>(null);
  const [beat, setBeat] = useState(0);
  const [approachBeat, setApproachBeat] = useState(0);
  const [approaching, setApproaching] = useState(false);
  const [report, setReport] = useState<ArenaResolution | null>(null);
  const [script, setScript] = useState<NarrationLine[]>([]);
  const [myJolt, setMyJolt] = useState(0);
  const [foeJolt, setFoeJolt] = useState(0);
  const shaking = useShake(myJolt + foeJolt);
  const [autoRunning, setAutoRunning] = useState(false);
  const beatRef = useRef(0);
  const scriptRef = useRef<NarrationLine[]>([]);
  const pendingRef = useRef<ArenaResolution | null>(null);
  const requestingRef = useRef(false);
  const bledRef = useRef({ last: 0, total: 0 });
  const characterRef = useRef(character);
  const challengeRef = useRef(challengeArena);
  const sufferRef = useRef(sufferBlow);
  const landRef = useRef(landArena);
  const stateRef = useRef(state);
  const statsRef = useRef(stats);
  const rosterRef = useRef(roster);
  const autoRef = useRef(false);
  const autoTimerRef = useRef(0);
  const drawRef = useRef(drawOpponent);
  const consumeRef = useRef(consumeItem);
  const notifyRef = useRef(notify);
  // The landing effect closes over an old render, so the continuation always
  // goes through this ref to reach the freshest closure (fighting already null).
  const continueAutoRef = useRef<() => Promise<void>>(async () => {});
  function beginDuel(hunter: Hunter, maxHealth: number) {
    if (fighting) return;
    if (autoTimerRef.current) {
      window.clearTimeout(autoTimerRef.current);
      autoTimerRef.current = 0;
    }
    beatRef.current = 0;
    pendingRef.current = null;
    scriptRef.current = [];
    setBeat(0);
    setScript([]);
    setReport(null);
    setFighting({ hunter, maxHealth });
  }
  function armAutomation() {
    if (!state.automation.arena || autoRef.current) return;
    autoRef.current = true;
    setAutoRunning(true);
  }
  function stopAuto(message?: string) {
    autoRef.current = false;
    setAutoRunning(false);
    if (autoTimerRef.current) {
      window.clearTimeout(autoTimerRef.current);
      autoTimerRef.current = 0;
    }
    if (message) notifyRef.current(message, true, "Arena");
  }
  useEffect(() => {
    characterRef.current = character;
    challengeRef.current = challengeArena;
    sufferRef.current = sufferBlow;
    landRef.current = landArena;
    stateRef.current = state;
    statsRef.current = stats;
    rosterRef.current = roster;
    drawRef.current = drawOpponent;
    consumeRef.current = consumeItem;
    notifyRef.current = notify;
    // The screen owns this loop, like the old job loops did: after each landed
    // duel it tops the body up with health potions while the bag has them,
    // then draws the next rested rival and books again, wounded or not, until
    // the day's attacks or the rivals run out. Descending bled is allowed on
    // purpose: the pit opens for any living body, and losing while hurt is the
    // realistic price. It lives here so every firing runs the freshest closure.
    continueAutoRef.current = async () => {
      autoTimerRef.current = 0;
      if (!autoRef.current) return;
      if (!stateRef.current.automation.arena) {
        stopAuto();
        return;
      }
      const charges = arenaCharges(stateRef.current.arenaDuels, Date.now());
      if (charges.left === 0) {
        stopAuto("The automatic arena stopped: the day's attacks are spent.");
        return;
      }
      for (let guard = 0; guard < 40; guard += 1) {
        const body = stateRef.current.character;
        const maximum = statsRef.current?.maxHealth ?? 0;
        if (!body || !autoRef.current) return;
        if (body.health >= maximum) break;
        const flask = stateRef.current.inventory
          .filter((entry) => findItem(entry.itemId)?.potion === "health")
          .sort(
            (first, second) =>
              (findItem(first.itemId)?.effect.healthMax ?? 0) -
              (findItem(second.itemId)?.effect.healthMax ?? 0),
          )[0];
        if (!flask) break;
        await consumeRef.current(flask.itemId);
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }
      if (!stateRef.current.character || !autoRef.current) return;
      const opponent = await drawRef.current();
      if (!autoRef.current) return;
      const hunter = opponent
        ? rosterRef.current.find((entry) => entry.id === opponent.hunterId)
        : undefined;
      if (!hunter) {
        stopAuto("The automatic arena stopped: nobody left to challenge.");
        return;
      }
      beginDuel(hunter, arenaStats(hunter).maxHealth);
    };
  });
  useEffect(() => {
    if (locked && autoRef.current) stopAuto(lockReason || undefined);
  }, [locked, lockReason]);
  useEffect(() => {
    return () => {
      autoRef.current = false;
      if (autoTimerRef.current) window.clearTimeout(autoTimerRef.current);
    };
  }, []);
  useEffect(() => {
    let alive = true;
    void api<{ hunters: Hunter[] }>("GET", "/api/roster").then((answer) => {
      if (alive && answer.ok && answer.data) setRoster(answer.data.hunters);
    });
    return () => {
      alive = false;
    };
  }, [report]);
  const [duelHistory, setDuelHistory] = useState<ArenaHistoryEntry[]>([]);
  useEffect(() => {
    let alive = true;
    void api<{ history: ArenaHistoryEntry[] }>("GET", "/api/arena/history").then((answer) => {
      if (alive && answer.ok && answer.data) setDuelHistory(answer.data.history);
    });
    return () => {
      alive = false;
    };
  }, [report]);
  const characterId = character?.id ?? "";
  const rosterById = useMemo(() => new Map(roster.map((hunter) => [hunter.id, hunter])), [roster]);
  const pastDuels = useMemo(
    () => describeArenaHistory(duelHistory, characterId),
    [duelHistory, characterId],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const view = useMemo(() => listArena(state, roster, search), [state, roster, search, moon]);
  useEffect(() => {
    if (!fighting) return;
    const target = fighting.hunter.id;
    let alive = true;
    let approachBeatLocal = 0;
    let approachingLocal = true;
    requestingRef.current = false;
    beatRef.current = 0;
    pendingRef.current = null;
    scriptRef.current = [];
    /* eslint-disable react-hooks/set-state-in-effect */
    setBeat(0);
    setScript([]);
    setApproachBeat(0);
    setApproaching(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const fireChallenge = () => {
      requestingRef.current = true;
      void challengeRef.current(target).then((resolution) => {
        if (!alive) return;
        requestingRef.current = false;
        if (!resolution) {
          setFighting(null);
          return;
        }
        pendingRef.current = resolution;
        bledRef.current = { last: characterRef.current?.health ?? 0, total: 0 };
        scriptRef.current = narrationOf({ foe: resolution.foe, combat: resolution.combat });
        setScript(scriptRef.current);
        setBeat(0);
      });
    };
    const timer = window.setInterval(() => {
      if (requestingRef.current) return;
      if (approachingLocal) {
        approachBeatLocal += 1;
        setApproachBeat(approachBeatLocal);
        if (approachBeatLocal >= HUNT_APPROACH_TICKS) {
          approachingLocal = false;
          setApproaching(false);
          fireChallenge();
        }
        return;
      }
      if (!pendingRef.current) return;
      beatRef.current += 1;
      setBeat(beatRef.current);
      const line = scriptRef.current[Math.min(beatRef.current, scriptRef.current.length) - 1];
      if (line?.blow === "ours") playSound(line.critical ? "crit" : "hit");
      if (line?.blow === "pet") playSound("snap");
      if (line?.blow === "theirs") playSound("hurt");
      if (line?.critical) {
        if (line.blow === "theirs") setMyJolt((count) => count + 1);
        else setFoeJolt((count) => count + 1);
      }
      if (line?.characterHealth !== undefined) {
        const delta = bledRef.current.last - line.characterHealth;
        if (delta > 0) {
          sufferRef.current(delta);
          bledRef.current = { last: line.characterHealth, total: bledRef.current.total + delta };
        }
      }
      if (beatRef.current >= scriptRef.current.length) {
        const held = pendingRef.current;
        pendingRef.current = null;
        window.clearInterval(timer);
        landRef.current();
        setReport(held);
        if (held.combat.victory) playSound("victory");
        else if (!held.combat.retreated) playSound("defeat");
        setFighting(null);
        if (autoRef.current) {
          autoTimerRef.current = window.setTimeout(() => void continueAutoRef.current(), 3000);
        }
      }
    }, HUNT_TICK_MS);
    return () => {
      alive = false;
      window.clearInterval(timer);
      if (pendingRef.current) {
        pendingRef.current = null;
        landRef.current();
      }
    };
  }, [fighting]);
  if (!character || !stats) return null;
  const busy = fighting !== null;
  const petAlong = canPetFight(pet) ? pet : null;
  function challenge(hunter: Hunter, rival: DerivedStats) {
    if (locked) return;
    armAutomation();
    beginDuel(hunter, rival.maxHealth);
  }
  async function challengeDrawn() {
    if (fighting || locked) return;
    const opponent = await drawOpponent();
    if (!opponent) return;
    const hunter = roster.find((entry) => entry.id === opponent.hunterId);
    if (!hunter) return;
    armAutomation();
    beginDuel(hunter, arenaStats(hunter).maxHealth);
  }
  const currentPage = clampPage(page, view.rivals.length, PAGE_SIZE);
  const pages = pageCount(view.rivals.length, PAGE_SIZE);
  const onPage = pageOf(view.rivals, currentPage, PAGE_SIZE);
  const duelLine =
    fighting && script.length > 0 && beat > 0 ? script[Math.min(beat, script.length) - 1] : null;
  const duelHealthLost =
    fighting && script.length > 0
      ? script
          .slice(0, Math.min(beat, script.length))
          .reduce((sum, entry) => sum + (entry.blow === "theirs" ? (entry.damage ?? 0) : 0), 0)
      : 0;
  return (
    <>
      <PageHeader
        title="Arena"
        description="The pit where one werewolf challenges another. An active wolf with breath left goes down too, yours and the rival's."
        action={
          <div className="flex items-center gap-2">
            {pet ? (
              <Tag tone="neutral">
                {canPetFight(pet)
                  ? "Companion along"
                  : isPetActive(pet)
                    ? "Companion out of energy"
                    : "Companion resting"}
              </Tag>
            ) : null}
            <Tag tone="neutral">
              {formatNumber(character.arenaWins)}V - {formatNumber(character.arenaLosses)}D
            </Tag>
          </div>
        }
      />

      <Panel
        title="The pit"
        description={
          "The arena only books fights between LV. " +
          formatNumber(view.band.start) +
          " and LV. " +
          formatNumber(view.band.end) +
          ": " +
          formatNumber(view.bandSize) +
          " hunters in that band. No experience is earned here: the winner draws " +
          formatNumber(view.spoils.min) +
          " to " +
          formatNumber(view.spoils.max) +
          " WCoins from the loser's purse, never more than a quarter of what they carry. The loser pays by the same rule. Whoever already dueled you rests until 06:00 before climbing again."
        }
        action={
          <Tag tone="neutral">
            {view.charges.left > 0
              ? formatNumber(view.charges.left) + " of " + ARENA_DAILY_ATTACKS + " attacks"
              : "Back in " + formatCooldown(view.charges.returnsIn)}
          </Tag>
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-ink-faint">
              {t(
                lockReason ||
                  view.reason ||
                  "Choose an opponent from your band or draw one at random.",
              )}
            </span>
            {autoRunning ? (
              <Button variant="primary" onClick={() => stopAuto()}>
                Stop
              </Button>
            ) : (
              <Tooltip label={lockReason || view.reason}>
                <Button
                  variant="primary"
                  disabled={!view.canFight || busy || locked}
                  onClick={challengeDrawn}
                >
                  {busy ? "In the pit..." : waitLabel || "Find an opponent"}
                </Button>
              </Tooltip>
            )}
          </div>
        }
      >
        <HunterSearchField
          value={search}
          onChange={(term) => {
            setSearch(term);
            setPage(1);
          }}
        />
      </Panel>

      {fighting ? (
        <Panel
          title="Duel"
          description={
            "You against " +
            displayNick(fighting.hunter.name) +
            ". At stake, a piece of the fallen one's purse: " +
            formatNumber(arenaSpoilsRange(fighting.hunter.level).min) +
            " to " +
            formatBronze(arenaSpoilsRange(fighting.hunter.level).max) +
            "."
          }
          action={<Tag tone="neutral">In the pit</Tag>}
          padding="none"
          className={cn(shaking && "card-shake")}
        >
          <div className="grid grid-cols-1 divide-y divide-edge border-b border-edge sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <Fighter
              gender={character.gender}
              name={displayNick(character.name)}
              level={character.level}
              side="You"
              health={character.health}
              maximum={stats.maxHealth}
              lost={duelHealthLost}
            />
            <Fighter
              gender={fighting.hunter.gender}
              name={displayNick(fighting.hunter.name)}
              level={fighting.hunter.level}
              side="Challenged"
              health={duelLine ? duelLine.creatureHealth : fighting.maxHealth}
              maximum={fighting.maxHealth}
              lost={
                duelLine ? Math.max(0, Math.round(fighting.maxHealth - duelLine.creatureHealth)) : 0
              }
            />
          </div>

          <div className="space-y-3 p-4">
            <Bar
              label={approaching ? "In the pit..." : "Duel"}
              current={approaching ? approachBeat : beat}
              maximum={approaching ? HUNT_APPROACH_TICKS : Math.max(1, script.length)}
              glows
            />
            {petAlong ? (
              <Bar
                label="Companion - Energy"
                current={petAlong.energy}
                maximum={petMaxEnergy(petLevelOf(petAlong))}
                tone="vigor"
              />
            ) : null}
            {duelLine ? (
              <p
                className={cn(
                  "truncate font-mono text-[11px]",
                  duelLine.critical ? "text-ember" : "text-ink-faint",
                )}
              >
                {emphasizeDamage(t(duelLine.text)).map((part, index) =>
                  typeof part === "string" ? (
                    part
                  ) : (
                    <strong
                      key={index}
                      className={cn("font-bold", !duelLine.critical && "text-ink")}
                    >
                      {part.damage}
                    </strong>
                  ),
                )}
              </p>
            ) : null}
          </div>
        </Panel>
      ) : null}

      {report ? <DuelReport report={report} /> : null}

      {view.rivals.length === 0 ? (
        <EmptyState
          title={search ? "No one by that name" : "Empty band tonight"}
          description={
            search
              ? "The pack is big, but not that big. Try another piece of the name."
              : "No one from your band in the pit right now. Ask for an opponent: the arena finds the closest level."
          }
        />
      ) : (
        <Panel
          title="Challengers"
          description="From the fairest fight to the most uneven."
          footer={
            pages > 1 ? (
              <Pagination page={currentPage} pages={pages} onChange={setPage} />
            ) : undefined
          }
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {onPage.map(({ hunter, stats: rival, inBand, cooldownLeft }) => {
              const resting = cooldownLeft > 0;
              return (
                <Card key={hunter.id} height="fill">
                  <CardHeader
                    art={<GenderArtFill gender={hunter.gender} />}
                    artSize="small"
                    artPadding="none"
                  >
                    <RowText
                      title={
                        <Link
                          href={"/ranking/" + hunter.id}
                          className="transition-colors hover:text-highlight"
                        >
                          {displayNick(hunter.name)}
                        </Link>
                      }
                      label={
                        (hunter.gender === "male" ? "Lumni" : "Luna") +
                        " - LV. " +
                        formatNumber(hunter.level)
                      }
                    />
                  </CardHeader>

                  <CardBody padding="none">
                    <div className="grid grid-cols-2 divide-x divide-y divide-edge sm:grid-cols-4">
                      {[
                        ...ATTRIBUTES.map((attribute) => ({
                          key: attribute.key,
                          label: attribute.name,
                          value: formatFraction(rival.totalAttributes[attribute.key]),
                        })),
                        { key: "health", label: "Health", value: formatNumber(rival.maxHealth) },
                        { key: "dodge", label: "Dodge", value: formatFraction(rival.dodgeExact) + " / " + DODGE_CHANCE_CAP + "%" },
                        {
                          key: "extra",
                          label: "Extra strike",
                          value:
                            formatFraction(extraStrikeChanceExact(rival.totalAttributes.agility, 0)) +
                            " / " +
                            EXTRA_STRIKE_CAP +
                            "%",
                        },
                        { key: "critical", label: "Critical", value: formatFraction(rival.criticalExact) + " / " + CRITICAL_CHANCE_CAP + "%" },
                      ].map((cell) => (
                        <div key={cell.key} className="px-2 py-3 text-center">
                          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                            {t(cell.label)}
                          </p>
                          <p className="mt-1 font-mono text-[11px] text-ink">{cell.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardBody>

                  <CardFooter className="w-full">
                    <Tooltip
                      block
                      className="w-full"
                      label={
                        !inBand
                          ? "Out of your band: the arena only books fights between LV. " +
                            formatNumber(view.band.start) +
                            " and LV. " +
                            formatNumber(view.band.end) +
                            "."
                          : resting
                            ? "You two already dueled today: the next challenge to them reopens at 06:00. " +
                              formatCooldown(cooldownLeft) +
                              " left."
                            : lockReason || view.reason
                      }
                    >
                      <Button
                        variant={inBand && !resting ? "primary" : "outline"}
                        fullWidth
                        disabled={
                          !inBand || resting || !view.canFight || busy || locked || autoRunning
                        }
                        onClick={() => challenge(hunter, rival)}
                      >
                        {!inBand
                          ? "Out of band"
                          : resting
                            ? "Resting"
                            : waitLabel || "Challenge"}
                      </Button>
                    </Tooltip>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel
        title="Latest fights"
        description={
          "The " +
          ARENA_HISTORY_SIZE +
          " most recent under your name in the pit: the ones you booked and the ones booked against you."
        }
        padding="none"
      >
        {pastDuels.length === 0 ? (
          <p className="px-4 py-3 text-xs text-ink-faint">
            {t("No duel recorded yet: the pit waits.")}
          </p>
        ) : (
          <List>
            {pastDuels.map((line) => {
              const rival = rosterById.get(line.rivalId);
              const lineage = rival ? (rival.gender === "male" ? "Lumni" : "Luna") : null;
              const coins =
                line.outcome === "draw" || line.spoils === 0
                  ? "0 WCoins"
                  : (line.outcome === "victory" ? "+" : "-") + formatBronze(line.spoils);

              return (
              <ListRow key={line.id}>
                <RowText
                  title={
                    (line.outcome === "victory"
                      ? "Victory over "
                      : line.outcome === "defeat"
                        ? "Defeat to "
                        : "Draw with ") + displayNick(line.rivalName)
                  }
                  description={(line.mine ? "Your attack" : "Attack received") + " - " + formatDay(line.at)}
                />
                <span className="flex shrink-0 items-center gap-2">
                  {lineage ? (
                    <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      {lineage}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "font-mono text-[11px]",
                      line.outcome === "victory" ? "text-ink" : "text-ink-faint",
                    )}
                  >
                    {coins}
                  </span>
                </span>
              </ListRow>
              );
            })}
          </List>
        )}
      </Panel>
    </>
  );
}
