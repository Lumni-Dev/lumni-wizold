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
import { findPet } from "@/models/entities/pet";
import { restRecoveryRatio } from "@/controllers/character.controller";
import { criticalMultiplierOf } from "@/models/rules/combat";
import { PET_MAX_LEVEL, REST_TICK_MS } from "@/shared/constants/game";
import { furyPotionClock } from "../presenters/item.presenter";
import { formatDate, formatFraction, formatNumber } from "@/shared/utils/format";
import { Button } from "../components/button";
import { CopyNick } from "../components/copy-nick";
import { DataRow } from "../components/data-row";
import { EmptyState } from "../components/empty-state";
import { GenderBanner } from "../components/gender-icon";
import { PetSheetHeader } from "../components/pet-icon";
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
            <Button variant="outline">Voltar ao ranking</Button>
          </Link>
        </div>
      </>
    );
  }

  const { hunter, isPlayer, positions, boardSize, stats, gear } = profile;
  const best = positions.reduce((first, next) => (next.position < first.position ? next : first));
  const wolf = hunter.pet ? findPet(hunter.pet.gender) : null;
  const genderDefinition = findGender(hunter.gender);
  const strength = stats.totalAttributes.strength;
  const endurance = stats.totalAttributes.endurance;
  const willpower = stats.totalAttributes.willpower;

  return (
    <>
      <PageHeader
        title={hunter.name}
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
            ) : isInPack(state, hunter.id) ? (
              <Tag tone="neutral">In the pack</Tag>
            ) : (
              <Button variant="secondary" onClick={() => invite({ id: hunter.id, name: hunter.name })}>
                Invite to the pack
              </Button>
            )}
            <Tag tone={isPlayer ? "light" : "neutral"}>
              {t("Best at") + " " + t(best.label) + " - " + formatNumber(best.position) + "º"}
            </Tag>
          </div>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Panel title="Sheet" padding="none">
            <GenderBanner gender={hunter.gender} />
            <div className="border-b border-edge px-4 py-3">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 truncate text-sm text-ink">{hunter.name}</p>
                  {hunter.vip ? <VipBadge /> : null}
                  <CopyNick name={hunter.name} />
                </div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {genderDefinition.label}
                </p>
              </div>
            </div>

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
              <Link href="/ranking">
                <Button variant="outline">Voltar ao ranking</Button>
              </Link>
            }
          >
            <List>
              {positions.map((position) => (
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

          <Panel
            title="Companion"
            description="Only what the wolf itself reveals: bloodline and training."
            padding="none"
          >
            {wolf && hunter.pet ? (
              <>
                <PetSheetHeader gender={hunter.pet.gender}>
                  <p className="truncate text-sm text-ink">{hunter.pet.name}</p>
                </PetSheetHeader>
                <List>
                  <DataRow label="Sex" value={wolf.label} />
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
          <Panel title="Combat" description="Each line says which attribute it comes from." padding="none">
            <List>
              <DataRow label="Strike (Strength)" value={formatFraction(strength)} />
              <DataRow label="Defense (Endurance)" value={formatFraction(endurance)} />
              <DataRow label="Dodge (Agility)" value={formatFraction(stats.dodgeExact) + "%"} />
              <DataRow
                label="Critical (Instinct)"
                value={formatFraction(stats.criticalExact) + "%"}
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

          <AttributesPanel stats={stats} gender={hunter.gender} />

          <EquipmentPanel gear={gear} forge={hunter.forge} />
        </div>
      </div>
    </>
  );
}
