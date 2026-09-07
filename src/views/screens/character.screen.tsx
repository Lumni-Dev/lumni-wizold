"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/controllers/api.client";
import { useGame } from "@/controllers/game.context";
import { detailInventory } from "@/controllers/inventory.controller";
import { profileOf } from "@/controllers/ranking.controller";
import { restRecoveryRatio } from "@/controllers/character.controller";
import { criticalMultiplierOf } from "@/models/rules/combat";
import { furyWillpowerBonus } from "@/models/rules/moon";
import { REST_TICK_MS } from "@/shared/constants/game";
import { findItem } from "@/models/data/items";
import { EQUIPMENT_SLOTS } from "@/models/entities/item";
import { findGender } from "@/models/entities/character";
import type { Hunter } from "@/models/entities/ranking";
import { FURY } from "@/shared/constants/tuning/fury";
import { formatDate, formatFraction, formatNumber } from "@/shared/utils/format";
import { displayNick } from "@/shared/utils/text";
import { furyDurationCopy, furyPotionClock } from "../presenters/item.presenter";
import { Button } from "../components/button";
import { CopyNick } from "../components/copy-nick";
import { isVip } from "@/models/rules/vip";
import { Tag } from "../components/tag";
import { VipBadge } from "../components/vip-badge";
import { DataRow } from "../components/data-row";
import { EmptyState } from "../components/empty-state";
import { GenderBanner } from "../components/gender-icon";
import { VitalActionButton } from "../components/vital-action-button";
import { FuryUseButton } from "../components/fury-use-button";
import { List, ListRow } from "../components/list";
import { SupplyRow } from "../components/supply-row";
import { Panel } from "../components/panel";
import { AttributesPanel } from "../components/attributes-panel";
import { EquipmentPanel } from "../components/equipment-panel";
import { ActivityLog } from "../components/activity-log";
import { PageHeader } from "../layout/page-header";

export function CharacterScreen() {
  const { state, character, stats, consumeItem } = useGame();
  const [roster, setRoster] = useState<Hunter[] | null>(null);
  const [now] = useState(() => Date.now());

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
  const willpower = stats.totalAttributes.willpower - stats.sources.fury.willpower;

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
        title="Character"
        description="The full sheet: who you are, what the body endures and how the beast answers."
        action={
          best ? (
            <Tag tone="light">
              Melhor em {best.label} - {formatNumber(best.position)}º
            </Tag>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Panel title="Sheet" padding="none">
            <GenderBanner gender={character.gender} />
            <div className="border-b border-edge px-4 py-3">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 truncate text-sm text-ink">{displayNick(character.name)}</p>
                  {isVip(character, now) ? <VipBadge /> : null}
                  <CopyNick name={character.name} />
                </div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {genderDefinition.label}
                </p>
              </div>
            </div>

            <List>
              <DataRow label="Level" value={"LV. " + formatNumber(character.level)} />
              <DataRow label="WCoins" value={formatNumber(character.bronze)} />
              {character.createdAt ? (
                <DataRow label="Created" value={formatDate(character.createdAt)} />
              ) : null}
            </List>
          </Panel>

          <Panel title="Hunt" description="Hunts, victories and defeats on the trail." padding="none">
            <List>
              <DataRow label="Hunts" value={formatNumber(character.hunts)} />
              <DataRow label="Victories" value={formatNumber(character.wins)} />
              <DataRow label="Defeats" value={formatNumber(character.losses)} />
            </List>
          </Panel>

          <Panel title="Arena" description="Duels, victories and defeats in the pit." padding="none">
            <List>
              <DataRow
                label="Duels"
                value={formatNumber(character.arenaWins + character.arenaLosses)}
              />
              <DataRow label="Victories" value={formatNumber(character.arenaWins)} />
              <DataRow label="Defeats" value={formatNumber(character.arenaLosses)} />
            </List>
          </Panel>

          {profile ? (
            <Panel
              title="Ranking"
              description={
                "Where you stand on every board, among " + formatNumber(profile.boardSize) + "."
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
            title="Supplies"
            description="The health potion restores a slice of max health at once. Resting does the same for free, little by little."
            action={<VitalActionButton size="small" />}
            padding="none"
          >
            {healthPotions.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No health potion"
                  description="The health potion is sold at the market."
                />
              </div>
            ) : (
              <List>
                {healthPotions.map(({ item, quantity }) => (
                  <SupplyRow
                    key={item.id}
                    item={item}
                    quantity={quantity}
                    description={
                      item.effect.healthMin !== undefined && item.effect.healthMax !== undefined
                        ? "Restores between " + item.effect.healthMin + " and " + item.effect.healthMax + " health"
                        : "Restores health"
                    }
                    action={
                      <Button
                        variant="primary"
                        disabled={healthFull}
                        onClick={() => consumeItem(item.id)}
                      >
                        Beber
                      </Button>
                    }
                  />
                ))}
              </List>
            )}
          </Panel>

          <Panel
            title="Fury"
            description="Fury Mode gives +10 to every attribute while it lasts. On the full moon the sky turns it on by itself; outside it, drink the potion."
            padding="none"
          >
            {furyPotions.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No fury potion"
                  description="The fury potion is sold at the market."
                />
              </div>
            ) : (
              <List>
                {furyPotions.map(({ item, quantity }) => (
                  <SupplyRow
                    key={item.id}
                    item={item}
                    quantity={quantity}
                    description={
                      "+" +
                      formatNumber(FURY.attributeBonus) +
                      " em cada atributo por " +
                      furyDurationCopy(item.effect.furyMinutes ?? 0, willpower)
                    }
                    action={<FuryUseButton onClick={() => consumeItem(item.id)} />}
                  />
                ))}
              </List>
            )}
          </Panel>

          <Panel title="Combat" description="Each line says which attribute it comes from." padding="none">
            <List>
              <DataRow label="Strike (Strength)" value={formatFraction(strength)} />
              <DataRow label="Defense (Endurance)" value={formatFraction(endurance)} />
              <DataRow label="Dodge (Agility)" value={formatFraction(stats.dodgeExact) + "%"} />
              <DataRow
                label="Critical (Instinct)"
                value={formatFraction(stats.criticalExact) + "%"}
              />
              <DataRow
                label="Bottled fury (Willpower)"
                value={"+" + formatFraction(furyWillpowerBonus(willpower) * 100) + "%"}
              />
              <DataRow label="Max health" value={formatNumber(stats.maxHealth)} />
              <DataRow
                label="Regeneration (Willpower)"
                value={
                  "+" +
                  formatNumber(
                    Math.max(1, Math.ceil(stats.maxHealth * restRecoveryRatio(willpower))),
                  ) +
                  " / " +
                  REST_TICK_MS / 1000 +
                  "s"
                }
              />
              <DataRow
                label="Fury duration (Willpower)"
                value={furyPotionClock(willpower)}
              />
              <DataRow
                label="Critical damage"
                value={"×" + criticalMultiplierOf().toFixed(2)}
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
