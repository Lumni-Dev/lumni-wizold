"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/controllers/api.client";
import { useGame } from "@/controllers/game.context";
import { profileOf } from "@/controllers/ranking.controller";
import { criticalMultiplierOf } from "@/models/rules/combat";
import { findItem } from "@/models/data/items";
import { enhancementOf } from "@/models/rules/forge";
import { EQUIPMENT_SLOTS } from "@/models/entities/item";
import { findGender, FORM_LABEL } from "@/models/entities/character";
import type { Hunter } from "@/models/entities/ranking";
import { formatNumber } from "@/shared/utils/format";
import { Bar } from "../components/bar";
import { Button } from "../components/button";
import { Tag } from "../components/tag";
import { DataRow } from "../components/data-row";
import { GenderBanner } from "../components/gender-icon";
import { VitalActionButton } from "../components/vital-action-button";
import { List, ListRow } from "../components/list";
import { Panel } from "../components/panel";
import { AttributesPanel } from "../components/attributes-panel";
import { EquipmentPanel } from "../components/equipment-panel";
import { ActivityLog } from "../components/activity-log";
import { PageHeader } from "../layout/page-header";

export function CharacterScreen() {
  const { state, character, stats, activity } = useGame();
  const [roster, setRoster] = useState<Hunter[] | null>(null);

  useEffect(() => {
    let alive = true;
    void api<{ hunters: Hunter[] }>("GET", "/api/roster").then((answer) => {
      if (alive && answer.ok && answer.data) setRoster(answer.data.hunters);
    });
    return () => {
      alive = false;
    };
  }, []);

  const profile = useMemo(
    () => (roster && character ? profileOf(state, roster, character.id) : null),
    [state, roster, character],
  );

  if (!character || !stats) return null;

  const strength = stats.totalAttributes.strength;
  const endurance = stats.totalAttributes.endurance;

  const genderDefinition = findGender(character.gender);
  const resting = activity?.kind === "rest";

  const forge = EQUIPMENT_SLOTS.reduce((total, slot) => {
    const itemId = state.equipment[slot];
    return total + (itemId ? enhancementOf(state.enhancements, itemId) : 0);
  }, 0);
  const gear = EQUIPMENT_SLOTS.map((slot) => {
    const itemId = state.equipment[slot];
    return {
      slot,
      item: itemId ? (findItem(itemId) ?? null) : null,
      level: itemId ? enhancementOf(state.enhancements, itemId) : 0,
    };
  });

  const best = profile
    ? profile.positions.reduce((first, next) => (next.position < first.position ? next : first))
    : null;

  const vitals = [
    {
      key: "health",
      label: "Vida",
      current: character.health,
      maximum: stats.maxHealth,
      glows: resting && character.health < stats.maxHealth,
    },
    {
      key: "rage",
      label: "Fúria",
      current: character.rage,
      maximum: stats.maxRage,
      glows: resting && character.rage < stats.maxRage,
    },
    {
      key: "experience",
      label: "Experiência",
      current: character.experience,
      maximum: stats.experienceNeeded,
      glows: false,
    },
  ] as const;

  return (
    <>
      <PageHeader
        title="Personagem"
        description="A ficha completa: quem você é, o que o corpo aguenta e como a fera responde."
        action={
          best ? (
            <Tag tone="light">
              Melhor em {best.label} - {formatNumber(best.position)}º
            </Tag>
          ) : undefined
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Panel title="Ficha" padding="none">
            <GenderBanner gender={character.gender} />
            <div className="space-y-2 border-b border-edge p-4">
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm text-ink">{character.name}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {genderDefinition.label}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Tag tone="neutral">NV. {formatNumber(character.level)}</Tag>
                <Tag tone="neutral">{FORM_LABEL[character.form]}</Tag>
              </div>
            </div>

            <List>
              <DataRow label="Bronze" value={formatNumber(character.bronze)} />
              <DataRow label="Forja" value={"+" + formatNumber(forge)} />
              <DataRow label="Mineração" value={"NV. " + formatNumber(state.mining.level)} />
            </List>
          </Panel>

          <Panel title="Caçada" description="Vitórias e derrotas na trilha." padding="none">
            <List>
              <DataRow label="Vitórias" value={formatNumber(character.wins)} />
              <DataRow label="Derrotas" value={formatNumber(character.losses)} />
            </List>
          </Panel>

          <Panel title="Arena" description="Vitórias e derrotas no fosso." padding="none">
            <List>
              <DataRow label="Vitórias" value={formatNumber(character.arenaWins)} />
              <DataRow label="Derrotas" value={formatNumber(character.arenaLosses)} />
            </List>
          </Panel>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Panel
            title="Vitais"
            description="Recuperam com descanso e poções, e com nada mais."
            action={<VitalActionButton size="small" />}
            padding="none"
          >
            <List>
              {vitals.map((vital) => (
                <ListRow key={vital.key} layout="column">
                  <Bar
                    label={vital.label}
                    current={vital.current}
                    maximum={vital.maximum}
                    wraps={vital.key === "experience"}
                    glows={vital.glows}
                    tone={
                      vital.key === "health" ? "blood" : vital.key === "rage" ? "fury" : "light"
                    }
                  />
                </ListRow>
              ))}
            </List>
          </Panel>

          <Panel title="Combate" description="Cada linha diz de qual atributo ela sai." padding="none">
            <List>
              <DataRow label="Golpe (Força)" value={formatNumber(strength)} />
              <DataRow label="Defesa (Resistência)" value={formatNumber(endurance)} />
              <DataRow label="Esquiva (Agilidade)" value={stats.dodge + "%"} />
              <DataRow label="Crítico (Instinto)" value={stats.critical + "%"} />
              <DataRow label="Vida máxima" value={formatNumber(stats.maxHealth)} />
              <DataRow
                label="Dano do crítico (Fúria)"
                value={"×" + criticalMultiplierOf(character.rage).toFixed(2).replace(".", ",")}
              />
            </List>
          </Panel>

          <AttributesPanel stats={stats} gender={character.gender} />

          <EquipmentPanel gear={gear} forge={forge} />

          {profile ? (
            <Panel
              title="Ranking"
              description={
                "Onde você aparece em cada quadro, entre " + formatNumber(profile.boardSize) + "."
              }
              padding="none"
              footer={
                <Link href="/ranking">
                  <Button variant="outline">Ver ranking completo</Button>
                </Link>
              }
            >
              <List>
                {profile.positions.map((position) => (
                  <ListRow key={position.key} className="justify-between">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      {position.label}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-ink-faint">
                        {formatNumber(position.value)}
                      </span>
                      <span className="w-14 text-right font-mono text-sm text-ink">
                        {formatNumber(position.position)}º
                      </span>
                    </span>
                  </ListRow>
                ))}
              </List>
            </Panel>
          ) : null}
        </div>
      </div>

      <ActivityLog entries={state.log} />
    </>
  );
}
