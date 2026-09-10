"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/controllers/api.client";
import { useGame } from "@/controllers/game.context";
import { useT } from "@/controllers/use-locale";
import { isInPack } from "@/controllers/pack.controller";
import { profileOf } from "@/controllers/ranking.controller";
import { findGender } from "@/models/entities/character";
import type { Hunter } from "@/models/entities/ranking";
import { restRecoveryRatio } from "@/controllers/character.controller";
import { criticalMultiplierOf, EXTRA_STRIKE_CAP, extraStrikeChanceExact } from "@/models/rules/combat";
import { CRITICAL_CHANCE_CAP, DODGE_CHANCE_CAP } from "@/models/rules/stats";
import { PET_MAX_LEVEL, REST_TICK_MS } from "@/shared/constants/game";
import { furyPotionClock } from "../presenters/item.presenter";
import { formatDate, formatFraction, formatNumber } from "@/shared/utils/format";
import { displayNick } from "@/shared/utils/text";
import { Button } from "../components/button";
import { CopyNick } from "../components/copy-nick";
import { DataRow } from "../components/data-row";
import { EmptyState } from "../components/empty-state";
import { CardHeader } from "../components/card";
import { GenderArtFill } from "../components/gender-icon";
import { PetArtFill } from "../components/pet-icon";
import { PET_TITLE } from "@/models/entities/pet";
import { List, ListRow } from "../components/list";
import { AttributesPanel } from "../components/attributes-panel";
import { EquipmentPanel } from "../components/equipment-panel";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
import { VipBadge } from "../components/vip-badge";
import { PageHeader } from "../layout/page-header";

export function RankingProfileScreen({ hunterId }: { hunterId: string }) {
  const { state, character, moon, invite } = useGame();
  const t = useT();
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

  const profile = useMemo(() => {
    void moon;
    return roster ? profileOf(state, roster, hunterId) : null;
  }, [state, roster, hunterId, moon]);

  if (!character) return null;
  if (roster === null) return null;

  if (!profile) {
    return (
      <>
        <PageHeader title="Profile" description="No one with that trail in the ranking." />
        <EmptyState
          title="Hunter not found"
          description="The name may have left the board. Go back and search again."
        />
        <div>
          <Link href="/ranking">
            <Button variant="outline">Back to the ranking</Button>
          </Link>
        </div>
      </>
    );
  }

  const { hunter, isPlayer, positions, boardSize, stats, gear } = profile;
  const best = positions.reduce((first, next) => (next.position < first.position ? next : first));
  const genderDefinition = findGender(hunter.gender);
  const strength = stats.totalAttributes.strength;
  const endurance = stats.totalAttributes.endurance;
  const willpower = stats.totalAttributes.willpower - stats.sources.fury.willpower;

  return (
    <>
      <PageHeader
        title={displayNick(hunter.name)}
        description={
          isPlayer
            ? "What other hunters see of your public sheet."
            : "A sample of what the board reveals: progress, gear and combat, without health or supplies."
        }
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isPlayer ? (
              <Link href="/character">
                <Button variant="secondary">Full sheet</Button>
              </Link>
            ) : null}
            <Tag tone={isPlayer ? "light" : "neutral"}>
              {t("Best at " + best.label + " - " + formatNumber(best.position) + "º")}
            </Tag>
          </div>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Panel
            title="Sheet"
            padding="none"
            footer={
              !isPlayer ? (
                isInPack(state, hunter.id) ? (
                  <Tag tone="neutral">In the pack</Tag>
                ) : (
                  <Button
                    variant="secondary"
                    size="medium"
                    fullWidth
                    onClick={() => invite({ id: hunter.id, name: hunter.name })}
                  >
                    Invite to the pack
                  </Button>
                )
              ) : undefined
            }
          >
            <CardHeader art={<GenderArtFill gender={hunter.gender} />}>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 truncate text-sm text-ink">{displayNick(hunter.name)}</p>
                  {hunter.vip ? <VipBadge /> : null}
                  <CopyNick name={hunter.name} />
                </div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {t(genderDefinition.label)}
                </p>
              </div>
            </CardHeader>

            <List>
              <DataRow label="Level" value={"LV. " + formatNumber(hunter.level)} />
              <DataRow label="WCoins" value={formatNumber(hunter.bronze)} />
              {hunter.createdAt ? (
                <DataRow label="Created" value={formatDate(hunter.createdAt)} />
              ) : null}
            </List>
          </Panel>

          <Panel title="Hunt" description="Hunts, victories and defeats on the trail." padding="none">
            <List>
              <DataRow label="Hunts" value={formatNumber(hunter.hunts)} />
              <DataRow label="Victories" value={formatNumber(hunter.wins)} />
              <DataRow label="Defeats" value={formatNumber(hunter.losses)} />
            </List>
          </Panel>

          <Panel title="Arena" description="Duels, victories and defeats in the pit." padding="none">
            <List>
              <DataRow
                label="Duels"
                value={formatNumber(hunter.arena + hunter.arenaLosses)}
              />
              <DataRow label="Victories" value={formatNumber(hunter.arena)} />
              <DataRow label="Defeats" value={formatNumber(hunter.arenaLosses)} />
            </List>
          </Panel>

          <Panel
            title="Ranking"
            description={"Where they stand on every board, among " + formatNumber(boardSize) + "."}
            padding="none"
            footer={
              <Link href="/ranking" className="block w-full">
                <Button variant="outline" size="medium" fullWidth>
                  Back to the ranking
                </Button>
              </Link>
            }
          >
            <List>
              {positions.map((position) => (
                <ListRow key={position.key} className="justify-between">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    {t(position.label)}
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

          <Panel
            title="Companion"
            description="Only what the wolf itself reveals: level and training."
            padding="none"
          >
            {hunter.pet ? (
              <>
                <CardHeader art={<PetArtFill />}>
                  <div className="min-w-0 space-y-1">
                    <p className="min-w-0 truncate text-sm text-ink">{hunter.pet.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      {t(PET_TITLE)}
                    </p>
                  </div>
                </CardHeader>
                <List>
                  <DataRow
                    label="Level"
                    value={formatNumber(hunter.pet.level) + " / " + formatNumber(PET_MAX_LEVEL)}
                  />
                </List>
              </>
            ) : (
              <p className="px-4 py-3 text-xs text-ink-faint">
              {t("Hunts alone, no wolf on the trail.")}
            </p>
            )}
          </Panel>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <AttributesPanel stats={stats} gender={hunter.gender} />

          <EquipmentPanel gear={gear} forge={hunter.forge} gender={hunter.gender} />

          <Panel title="Combat" description="Each line says which attribute it comes from." padding="none">
            <List>
              <DataRow label="Strike (Strength)" value={formatFraction(strength)} />
              <DataRow label="Defense (Endurance)" value={formatFraction(endurance)} />
              <DataRow label="Dodge (Agility)" value={formatFraction(stats.dodgeExact) + " / " + DODGE_CHANCE_CAP + "%"} />
              <DataRow
                label="Extra strike (Agility)"
                value={
                  formatFraction(extraStrikeChanceExact(stats.totalAttributes.agility, 0)) +
                  " / " +
                  EXTRA_STRIKE_CAP +
                  "%"
                }
              />
              <DataRow
                label="Critical (Instinct)"
                value={formatFraction(stats.criticalExact) + " / " + CRITICAL_CHANCE_CAP + "%"}
              />
              <DataRow
                label="Critical damage"
                value={"×" + criticalMultiplierOf().toFixed(2)}
              />
              <DataRow label="Max health" value={formatNumber(stats.maxHealth)} />
              <DataRow
                label="Regeneration (Willpower)"
                value={
                  "+" +
                  formatNumber(
                    Math.max(
                      1,
                      Math.ceil(
                        stats.maxHealth * restRecoveryRatio(stats.totalAttributes.willpower),
                      ),
                    ),
                  ) +
                  " / " +
                  REST_TICK_MS / 1000 +
                  "s"
                }
              />
              <DataRow
                label="Fury: small potion"
                value={furyPotionClock("small", willpower)}
              />
              <DataRow
                label="Fury: medium potion"
                value={furyPotionClock("medium", willpower)}
              />
              <DataRow
                label="Fury: large potion"
                value={furyPotionClock("large", willpower)}
              />
            </List>
          </Panel>
        </div>
      </div>
    </>
  );
}
