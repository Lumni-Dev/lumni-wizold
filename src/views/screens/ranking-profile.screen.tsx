"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/controllers/api.client";
import { useGame } from "@/controllers/game.context";
import { isInPack } from "@/controllers/pack.controller";
import { profileOf } from "@/controllers/ranking.controller";
import { findGender } from "@/models/entities/character";
import type { Hunter } from "@/models/entities/ranking";
import { findPet } from "@/models/entities/pet";
import { criticalMultiplierOf } from "@/models/rules/combat";
import { PET_MAX_LEVEL } from "@/shared/constants/game";
import { formatNumber } from "@/shared/utils/format";
import { Button } from "../components/button";
import { CopyNick } from "../components/copy-nick";
import { DataRow } from "../components/data-row";
import { EmptyState } from "../components/empty-state";
import { GenderSheetHeader } from "../components/gender-icon";
import { PetSheetHeader } from "../components/pet-icon";
import { List, ListRow } from "../components/list";
import { AttributesPanel } from "../components/attributes-panel";
import { EquipmentPanel } from "../components/equipment-panel";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
import { PageHeader } from "../layout/page-header";

export function RankingProfileScreen({ hunterId }: { hunterId: string }) {
  const { state, character, moon, invite } = useGame();
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
        <PageHeader title="Perfil" description="Ninguém com esse rastro no ranking." />
        <EmptyState
          title="Caçador não encontrado"
          description="O nome pode ter saído do quadro. Volte e procure de novo."
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

  return (
    <>
      <PageHeader
        title={hunter.name}
        description={
          isPlayer
            ? "O que os outros caçadores veem da sua ficha pública."
            : "Amostra do que o quadro revela: progresso, equipamento e combate, sem vida nem suprimentos."
        }
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isPlayer ? (
              <Link href="/character">
                <Button variant="secondary">Ficha completa</Button>
              </Link>
            ) : isInPack(state, hunter.id) ? (
              <Tag tone="neutral">Na matilha</Tag>
            ) : (
              <Button variant="secondary" onClick={() => invite({ id: hunter.id, name: hunter.name })}>
                Convidar para matilha
              </Button>
            )}
            <Tag tone={isPlayer ? "light" : "neutral"}>
              Melhor em {best.label} - {formatNumber(best.position)}º
            </Tag>
          </div>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Panel title="Ficha" padding="none">
            <GenderSheetHeader gender={hunter.gender}>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 truncate text-sm text-ink">{hunter.name}</p>
                  <CopyNick name={hunter.name} />
                </div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {genderDefinition.label}
                </p>
              </div>
            </GenderSheetHeader>

            <List>
              <DataRow label="Nível" value={"NV. " + formatNumber(hunter.level)} />
              <DataRow label="WCoins" value={formatNumber(hunter.bronze)} />
            </List>
          </Panel>

          <Panel title="Caçada" description="Caçadas, vitórias e derrotas na trilha." padding="none">
            <List>
              <DataRow label="Caçadas" value={formatNumber(hunter.hunts)} />
              <DataRow label="Vitórias" value={formatNumber(hunter.wins)} />
              <DataRow label="Derrotas" value={formatNumber(hunter.losses)} />
            </List>
          </Panel>

          <Panel title="Arena" description="Duelos, vitórias e derrotas no fosso." padding="none">
            <List>
              <DataRow
                label="Duelos"
                value={formatNumber(hunter.arena + hunter.arenaLosses)}
              />
              <DataRow label="Vitórias" value={formatNumber(hunter.arena)} />
              <DataRow label="Derrotas" value={formatNumber(hunter.arenaLosses)} />
            </List>
          </Panel>

          <Panel
            title="Ranking"
            description={"Onde aparece em cada quadro, entre " + formatNumber(boardSize) + "."}
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
            title="Mascote"
            description="Só o que o lobo em si revela: linhagem e treino."
            padding="none"
          >
            {wolf && hunter.pet ? (
              <>
                <PetSheetHeader gender={hunter.pet.gender}>
                  <p className="truncate text-sm text-ink">{hunter.pet.name}</p>
                </PetSheetHeader>
                <List>
                  <DataRow label="Sexo" value={wolf.label} />
                  <DataRow
                    label="Nível"
                    value={formatNumber(hunter.pet.level) + " / " + formatNumber(PET_MAX_LEVEL)}
                  />
                </List>
              </>
            ) : (
              <p className="px-4 py-3 text-xs text-ink-faint">Caça sozinho, sem lobo no rastro.</p>
            )}
          </Panel>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Panel title="Combate" description="Cada linha diz de qual atributo ela sai." padding="none">
            <List>
              <DataRow label="Golpe (Força)" value={formatNumber(strength)} />
              <DataRow label="Defesa (Resistência)" value={formatNumber(endurance)} />
              <DataRow label="Esquiva (Agilidade)" value={stats.dodge + "%"} />
              <DataRow label="Crítico (Instinto)" value={stats.critical + "%"} />
              <DataRow
                label="Dano do crítico"
                value={"×" + criticalMultiplierOf().toFixed(2).replace(".", ",")}
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
