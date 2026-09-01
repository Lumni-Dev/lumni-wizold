"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/controllers/api.client";
import { useGame } from "@/controllers/game.context";
import { detailInventory } from "@/controllers/inventory.controller";
import { profileOf } from "@/controllers/ranking.controller";
import { criticalMultiplierOf } from "@/models/rules/combat";
import { findItem } from "@/models/data/items";
import { EQUIPMENT_SLOTS } from "@/models/entities/item";
import { findGender } from "@/models/entities/character";
import type { Hunter } from "@/models/entities/ranking";
import { FURY } from "@/shared/constants/tuning/fury";
import { formatNumber } from "@/shared/utils/format";
import { Button } from "../components/button";
import { CopyNick } from "../components/copy-nick";
import { Tag } from "../components/tag";
import { DataRow } from "../components/data-row";
import { EmptyState } from "../components/empty-state";
import { GenderSheetHeader } from "../components/gender-icon";
import { ItemIcon } from "../components/item-icon";
import { VitalActionButton } from "../components/vital-action-button";
import { FuryUseButton } from "../components/fury-use-button";
import { List, ListRow, RowText } from "../components/list";
import { Panel } from "../components/panel";
import { AttributesPanel } from "../components/attributes-panel";
import { EquipmentPanel } from "../components/equipment-panel";
import { ActivityLog } from "../components/activity-log";
import { PageHeader } from "../layout/page-header";

export function CharacterScreen() {
  const { state, character, stats, consumeItem } = useGame();
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

  const healthPotions = useMemo(
    () => detailInventory(state).filter((slot) => slot.item.potion === "health"),
    [state],
  );
  const furyPotions = useMemo(
    () => detailInventory(state).filter((slot) => slot.item.potion === "rage"),
    [state],
  );

  if (!character || !stats) return null;

  const strength = stats.totalAttributes.strength;
  const endurance = stats.totalAttributes.endurance;

  const genderDefinition = findGender(character.gender);
  const healthFull = character.health >= stats.maxHealth;

  const forge = EQUIPMENT_SLOTS.reduce(
    (total, slot) => total + (state.equipment[slot]?.enhancement ?? 0),
    0,
  );
  const gear = EQUIPMENT_SLOTS.map((slot) => {
    const piece = state.equipment[slot];
    return {
      slot,
      item: piece ? (findItem(piece.itemId) ?? null) : null,
      level: piece ? piece.enhancement : 0,
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
          <Panel title="Ficha" padding="none">
            <GenderSheetHeader gender={character.gender}>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 truncate text-sm text-ink">{character.name}</p>
                  <CopyNick name={character.name} />
                </div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {genderDefinition.label}
                </p>
              </div>
            </GenderSheetHeader>

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
          <Panel
            title="Suprimentos"
            description="A poção de vida recupera uma fatia da vida máxima na hora. Repousar faz o mesmo de graça, aos poucos."
            action={<VitalActionButton size="small" />}
            padding="none"
          >
            {healthPotions.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Sem poção de vida"
                  description="A poção de vida é vendida no mercado."
                />
              </div>
            ) : (
              <List>
                {healthPotions.map(({ item, quantity }) => (
                  <ListRow key={item.id} padding="art">
                    <ItemIcon item={item} />
                    <RowText
                      title={item.name}
                      description={
                        "Recupera " +
                        Math.round((item.effect.healthRatio ?? 0) * 100) +
                        "% da vida máxima"
                      }
                    />
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="font-mono text-xs text-ink-soft">
                        x{formatNumber(quantity)}
                      </span>
                      <Button variant="primary" disabled={healthFull} onClick={() => consumeItem(item.id)}>
                        Usar
                      </Button>
                    </span>
                  </ListRow>
                ))}
              </List>
            )}
          </Panel>

          <Panel
            title="Fúria"
            description="A poção de fúria dá +10 em cada atributo enquanto dura, e não devolve vida."
            padding="none"
          >
            {furyPotions.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Sem poção de fúria"
                  description="A poção de fúria é vendida no mercado."
                />
              </div>
            ) : (
              <List>
                {furyPotions.map(({ item, quantity }) => (
                  <ListRow key={item.id} padding="art">
                    <ItemIcon item={item} />
                    <RowText
                      title={item.name}
                      description={
                        "+" +
                        formatNumber(FURY.attributeBonus) +
                        " em cada atributo por " +
                        formatNumber(item.effect.furyMinutes ?? 0) +
                        " min"
                      }
                    />
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="font-mono text-xs text-ink-soft">
                        x{formatNumber(quantity)}
                      </span>
                      <FuryUseButton onClick={() => consumeItem(item.id)} />
                    </span>
                  </ListRow>
                ))}
              </List>
            )}
          </Panel>

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
