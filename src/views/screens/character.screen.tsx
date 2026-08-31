"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/controllers/api.client";
import { useGame } from "@/controllers/game.context";
import { profileOf } from "@/controllers/ranking.controller";
import { criticalMultiplierOf } from "@/models/rules/combat";
import { findItem } from "@/models/data/items";
import { enhancementOf } from "@/models/rules/forge";
import { EQUIPMENT_SLOTS } from "@/models/entities/item";
import { findGender } from "@/models/entities/character";
import type { Hunter } from "@/models/entities/ranking";
import { formatNumber } from "@/shared/utils/format";
import { CopyNick } from "../components/copy-nick";
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
  const { state, character, stats } = useGame();
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
          <Panel title="Ficha" action={<VitalActionButton size="small" />} padding="none">
            <GenderBanner gender={character.gender} />
            <div className="border-b border-edge p-4">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 truncate text-sm text-ink">{character.name}</p>
                  <CopyNick name={character.name} />
                </div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {genderDefinition.label}
                </p>
              </div>
            </div>

            <List>
              <DataRow label="Nível" value={"NV. " + formatNumber(character.level)} />
              <DataRow label="WCoins" value={formatNumber(character.bronze)} />
            </List>
          </Panel>

          <Panel title="Caçada" description="Caçadas, vitórias e derrotas na trilha." padding="none">
            <List>
              <DataRow label="Caçadas" value={formatNumber(character.hunts)} />
              <DataRow label="Vitórias" value={formatNumber(character.wins)} />
              <DataRow label="Derrotas" value={formatNumber(character.losses)} />
            </List>
          </Panel>

          <Panel title="Arena" description="Duelos, vitórias e derrotas no fosso." padding="none">
            <List>
              <DataRow
                label="Duelos"
                value={formatNumber(character.arenaWins + character.arenaLosses)}
              />
              <DataRow label="Vitórias" value={formatNumber(character.arenaWins)} />
              <DataRow label="Derrotas" value={formatNumber(character.arenaLosses)} />
            </List>
          </Panel>

          {profile ? (
            <Panel
              title="Ranking"
              description={
                "Onde você aparece em cada quadro, entre " + formatNumber(profile.boardSize) + "."
              }
              padding="none"
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

        <div className="space-y-6 lg:col-span-2">
          <Panel title="Combate" description="Cada linha diz de qual atributo ela sai." padding="none">
            <List>
              <DataRow label="Golpe (Força)" value={formatNumber(strength)} />
              <DataRow label="Defesa (Resistência)" value={formatNumber(endurance)} />
              <DataRow label="Esquiva (Agilidade)" value={stats.dodge + "%"} />
              <DataRow label="Crítico (Instinto)" value={stats.critical + "%"} />
              <DataRow label="Vida máxima" value={formatNumber(stats.maxHealth)} />
              <DataRow
                label="Dano do crítico"
                value={"×" + criticalMultiplierOf().toFixed(2).replace(".", ",")}
              />
            </List>
          </Panel>

          <AttributesPanel stats={stats} gender={character.gender} />

          <EquipmentPanel gear={gear} forge={forge} />
        </div>
      </div>

      <ActivityLog entries={state.log} />
    </>
  );
}
