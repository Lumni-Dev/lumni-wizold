"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/controllers/api.client";
import { ACTIVITY_WAIT_LABEL, useActivityLock } from "@/controllers/use-activity-lock";
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
import { ARENA_DAILY_ATTACKS, arenaSpoilsRange, arenaStats } from "@/models/rules/arena";
import type { DerivedStats } from "@/models/rules/stats";
import { canPetFight, isPetActive, petLevelOf, petMaxEnergy } from "@/models/rules/pet";
import { playSound } from "@/controllers/sound";
import { HUNT_TICK_MS } from "@/shared/constants/game";
import { ICON_FRAME_INSET } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { formatDay, formatNumber, formatBronze } from "@/shared/utils/format";
import { clampPage, pageCount, pageOf } from "@/shared/utils/pagination";
import { emphasizeDamage, narrationOf, type NarrationLine } from "../presenters/hunt.presenter";
import { Bar } from "../components/bar";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { BodyGate } from "../components/body-gate";
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
}: {
  gender: Gender;
  name: string;
  level: number;
  side: string;
  health: number;
  maximum: number;
}) {
  const left = Math.max(0, Math.round(health));
  return (
    <div className={cn("flex items-center gap-3 p-4", ICON_FRAME_INSET)}>
      <GenderIcon gender={gender} size="large" />
      <div className="min-w-0 flex-1 space-y-2">
        <RowText title={name} label={side + " - NV. " + formatNumber(level)} />
        <Bar
          label="Vida"
          current={left}
          maximum={maximum}
          tone={left > maximum / 2 ? "blood" : "ember"}
        />
      </div>
    </div>
  );
}
function DuelReport({ report }: { report: ArenaResolution }) {
  const { combat, hunter } = report;
  const outcome = combat.victory ? "Vitória" : combat.retreated ? "Empate" : "Derrota";
  return (
    <Panel
      title="Último duelo"
      description={hunter.name + " (NV. " + formatNumber(hunter.level) + ")"}
      action={<Tag tone="neutral">{outcome}</Tag>}
      padding="none"
    >
      <div className="grid grid-cols-1 items-start border-b border-edge sm:grid-cols-2 sm:divide-x sm:divide-edge">
        <List>
          <DataRow
            label={report.spoils < 0 ? "WCoins perdidas" : "WCoins tomadas"}
            value={(report.spoils < 0 ? "-" : "+") + formatNumber(Math.abs(report.spoils))}
          />
          <DataRow label="Dano causado" value={formatNumber(combat.damageDealt)} />
          <DataRow label="Dano recebido" value={formatNumber(combat.damageTaken)} />
        </List>
        <div className="space-y-2 p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">O fosso</p>
          <p className="text-xs leading-relaxed text-ink-faint">
            {combat.victory
              ? hunter.name + " ficou no chão, e a bolsa é sua."
              : combat.retreated
                ? "Os dois aguentaram até o fim e ninguém pôs o outro no chão."
                : hunter.name + " levou a melhor. Você sai por baixo, mas sai."}
          </p>
          <p className="text-xs text-ink-faint">
            O fosso não paga experiência: aqui as WCoins só trocam de dono.
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
              {round.text}
            </span>
          </ListRow>
        ))}
      </List>
    </Panel>
  );
}
export function ArenaScreen() {
  const { state, character, stats, pet, moon, drawOpponent, challengeArena, sufferBlow, landArena } =
    useGame();
  const { locked } = useActivityLock();
  const waitLabel = locked ? ACTIVITY_WAIT_LABEL : "";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [roster, setRoster] = useState<Hunter[]>([]);
  const [fighting, setFighting] = useState<{ hunter: Hunter; maxHealth: number } | null>(null);
  const [beat, setBeat] = useState(0);
  const [report, setReport] = useState<ArenaResolution | null>(null);
  const [script, setScript] = useState<NarrationLine[]>([]);
  const [myJolt, setMyJolt] = useState(0);
  const [foeJolt, setFoeJolt] = useState(0);
  const shaking = useShake(myJolt + foeJolt);
  const beatRef = useRef(0);
  const scriptRef = useRef<NarrationLine[]>([]);
  const pendingRef = useRef<ArenaResolution | null>(null);
  const requestingRef = useRef(false);
  const bledRef = useRef({ last: 0, total: 0 });
  const characterRef = useRef(character);
  const challengeRef = useRef(challengeArena);
  const sufferRef = useRef(sufferBlow);
  const landRef = useRef(landArena);
  useEffect(() => {
    characterRef.current = character;
    challengeRef.current = challengeArena;
    sufferRef.current = sufferBlow;
    landRef.current = landArena;
  });
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
    let fillTimer = 0;
    requestingRef.current = true;
    beatRef.current = 0;
    pendingRef.current = null;
    scriptRef.current = [];
    /* eslint-disable react-hooks/set-state-in-effect */
    setBeat(0);
    setScript([]);
    /* eslint-enable react-hooks/set-state-in-effect */
    void challengeRef.current(target).then((resolution) => {
      if (!alive) return;
      if (!resolution) {
        requestingRef.current = false;
        setFighting(null);
        return;
      }
      pendingRef.current = resolution;
      bledRef.current = { last: characterRef.current?.health ?? 0, total: 0 };
      scriptRef.current = narrationOf({ foe: resolution.foe, combat: resolution.combat });
      setScript(scriptRef.current);
      setBeat(0);
      fillTimer = window.setTimeout(() => {
        requestingRef.current = false;
      }, HUNT_TICK_MS);
    });
    const timer = window.setInterval(() => {
      if (!pendingRef.current || requestingRef.current) return;
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
      }
    }, HUNT_TICK_MS);
    return () => {
      alive = false;
      window.clearInterval(timer);
      if (fillTimer) window.clearTimeout(fillTimer);
      if (pendingRef.current) {
        pendingRef.current = null;
        landRef.current();
      }
    };
  }, [fighting]);
  if (!character || !stats) return null;
  const busy = fighting !== null;
  const petAlong = canPetFight(pet) ? pet : null;
  function beginDuel(hunter: Hunter, maxHealth: number) {
    if (fighting) return;
    beatRef.current = 0;
    pendingRef.current = null;
    scriptRef.current = [];
    setBeat(0);
    setScript([]);
    setReport(null);
    setFighting({ hunter, maxHealth });
  }
  function challenge(hunter: Hunter, rival: DerivedStats) {
    beginDuel(hunter, rival.maxHealth);
  }
  async function challengeDrawn() {
    if (fighting) return;
    const opponent = await drawOpponent();
    if (!opponent) return;
    const hunter = roster.find((entry) => entry.id === opponent.hunterId);
    if (!hunter) return;
    beginDuel(hunter, arenaStats(hunter).maxHealth);
  }
  const currentPage = clampPage(page, view.rivals.length, PAGE_SIZE);
  const pages = pageCount(view.rivals.length, PAGE_SIZE);
  const onPage = pageOf(view.rivals, currentPage, PAGE_SIZE);
  const duelLine =
    fighting && script.length > 0 && beat > 0 ? script[Math.min(beat, script.length) - 1] : null;
  return (
    <>
      <PageHeader
        title="Arena"
        description="O fosso onde um lobisomem desafia outro. Mascote ativo e com fôlego desce junto, o seu e o do rival."
        action={
          <div className="flex items-center gap-2">
            {pet ? (
              <Tag tone="neutral">
                {canPetFight(pet)
                  ? "Mascote acompanhando"
                  : isPetActive(pet)
                    ? "Mascote sem energia"
                    : "Mascote em repouso"}
              </Tag>
            ) : null}
            <Tag tone="neutral">
              {formatNumber(character.arenaWins)}V - {formatNumber(character.arenaLosses)}D
            </Tag>
          </div>
        }
      />

      <Panel
        title="O fosso"
        description={
          "A arena só marca luta entre NV. " +
          formatNumber(view.band.start) +
          " e NV. " +
          formatNumber(view.band.end) +
          ": " +
          formatNumber(view.bandSize) +
          " caçadores nessa faixa. Não se ganha experiência aqui: quem vence tira da bolsa do perdedor de " +
          formatNumber(view.spoils.min) +
          " a " +
          formatNumber(view.spoils.max) +
          " WCoins, sorteadas, e nunca mais que um quarto do que ele carrega. Quem perde paga pela mesma régua. Quem já duelou com você descansa até as 06:00 antes de subir de novo."
        }
        action={
          <Tag tone="neutral">
            {view.charges.left > 0
              ? formatNumber(view.charges.left) + " de " + ARENA_DAILY_ATTACKS + " ataques"
              : "Volta em " + formatCooldown(view.charges.returnsIn)}
          </Tag>
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-ink-faint">
              {view.reason ?? "Escolha um adversário da sua faixa ou busque um ao acaso."}
            </span>
            <BodyGate
              open={!busy && view.charges.left > 0}
              requireFull
              reason="Recupere-se antes do fosso."
            >
              <Tooltip label={view.reason}>
                <Button
                  variant="primary"
                  disabled={!view.canFight || busy || locked}
                  onClick={challengeDrawn}
                >
                  {busy ? "No fosso..." : waitLabel || "Buscar adversário"}
                </Button>
              </Tooltip>
            </BodyGate>
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
          title="Duelo"
          description={
            "Você contra " +
            fighting.hunter.name +
            ". Em jogo, um pedaço da bolsa de quem cair: de " +
            formatNumber(arenaSpoilsRange(fighting.hunter.level).min) +
            " a " +
            formatBronze(arenaSpoilsRange(fighting.hunter.level).max) +
            "."
          }
          action={<Tag tone="neutral">No fosso</Tag>}
          padding="none"
          className={cn(shaking && "card-shake")}
        >
          <div className="grid grid-cols-1 divide-y divide-edge border-b border-edge sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <Fighter
              gender={character.gender}
              name={character.name}
              level={character.level}
              side="Você"
              health={character.health}
              maximum={stats.maxHealth}
            />
            <Fighter
              gender={fighting.hunter.gender}
              name={fighting.hunter.name}
              level={fighting.hunter.level}
              side="Desafiado"
              health={duelLine ? duelLine.creatureHealth : script.length > 0 ? fighting.maxHealth : 0}
              maximum={fighting.maxHealth}
            />
          </div>

          <div className="space-y-3 p-4">
            <Bar label="Duelo" current={beat} maximum={Math.max(1, script.length)} glows />
            {petAlong ? (
              <Bar
                label="Mascote - Energia"
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
                {emphasizeDamage(duelLine.text).map((part, index) =>
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
          title={search ? "Ninguém com esse nome" : "Faixa vazia esta noite"}
          description={
            search
              ? "A matilha é grande, mas não tanto. Tente outro pedaço do nome."
              : "Ninguém da sua faixa no fosso agora. Peça um adversário: a arena procura o nível mais próximo."
          }
        />
      ) : (
        <Panel
          title="Desafiantes"
          description="Da luta mais justa para a mais desigual."
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
                  <CardHeader art={<GenderArtFill gender={hunter.gender} />}>
                    <RowText
                      title={
                        <Link
                          href={"/ranking/" + hunter.id}
                          className="transition-colors hover:text-highlight"
                        >
                          {hunter.name}
                        </Link>
                      }
                      label={
                        (hunter.gender === "male" ? "Lumni" : "Luna") +
                        " - NV. " +
                        formatNumber(hunter.level)
                      }
                    />
                  </CardHeader>

                  <CardBody padding="none">
                    <div className="grid grid-cols-4 divide-x divide-y divide-edge">
                      {[
                        ...ATTRIBUTES.map((attribute) => ({
                          key: attribute.key,
                          label: attribute.name,
                          value: formatNumber(rival.totalAttributes[attribute.key]),
                        })),
                        { key: "health", label: "Vida", value: formatNumber(rival.maxHealth) },
                        { key: "dodge", label: "Esquiva", value: rival.dodge + "%" },
                        { key: "critical", label: "Crítico", value: rival.critical + "%" },
                      ].map((cell) => (
                        <div key={cell.key} className="px-2 py-3 text-center">
                          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                            {cell.label}
                          </p>
                          <p className="mt-1 font-mono text-[11px] text-ink">{cell.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardBody>

                  <CardFooter className="w-full">
                    <BodyGate
                      open={inBand && !resting && !busy && view.charges.left > 0}
                      requireFull
                      fullWidth
                      reason="Recupere-se antes do fosso."
                    >
                      <Tooltip
                        block
                        className="w-full"
                        label={
                          !inBand
                            ? "Fora da sua faixa: a arena só marca luta entre NV. " +
                              formatNumber(view.band.start) +
                              " e NV. " +
                              formatNumber(view.band.end) +
                              "."
                            : resting
                              ? "Vocês já duelaram hoje: o próximo desafio a ele reabre às 06:00. Faltam " +
                                formatCooldown(cooldownLeft) +
                                "."
                              : view.reason
                        }
                      >
                        <Button
                          variant={inBand && !resting ? "primary" : "outline"}
                          fullWidth
                          disabled={!inBand || resting || !view.canFight || busy || locked}
                          onClick={() => challenge(hunter, rival)}
                        >
                          {!inBand
                            ? "Fora da faixa"
                            : resting
                              ? "Descansando"
                              : waitLabel || "Desafiar"}
                        </Button>
                      </Tooltip>
                    </BodyGate>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel
        title="Últimas lutas"
        description={
          "As " +
          ARENA_HISTORY_SIZE +
          " mais recentes do seu nome no fosso: as que você marcou e as que marcaram contra você."
        }
        padding="none"
      >
        {pastDuels.length === 0 ? (
          <p className="px-4 py-3 text-xs text-ink-faint">
            Nenhum duelo registrado ainda: o fosso espera.
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
                      ? "Vitória sobre "
                      : line.outcome === "defeat"
                        ? "Derrota para "
                        : "Empate com ") + line.rivalName
                  }
                  description={(line.mine ? "Ataque seu" : "Ataque recebido") + " - " + formatDay(line.at)}
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
