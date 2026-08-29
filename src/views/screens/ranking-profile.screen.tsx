"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/controllers/api.client";
import { useGame } from "@/controllers/game.context";
import { profileOf } from "@/controllers/ranking.controller";
import { ATTRIBUTES } from "@/models/entities/attribute";
import type { Hunter } from "@/models/entities/ranking";
import { SLOT_LABEL } from "@/models/entities/item";
import { findPet } from "@/models/entities/pet";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { Button } from "../components/button";
import { DataRow } from "../components/data-row";
import { EmptyState } from "../components/empty-state";
import { AttributeIcon } from "../components/attribute-icon";
import { GenderBanner } from "../components/gender-icon";
import { IconFrame } from "../components/icon-frame";
import { PetBanner } from "../components/pet-icon";
import { ItemIcon } from "../components/item-icon";
import { List, ListRow, RowText } from "../components/list";
import { Panel } from "../components/panel";
import { Tag } from "../components/tag";
import { PageHeader } from "../layout/page-header";
export function RankingProfileScreen({ hunterId }: { hunterId: string }) {
  const { state, character, moon } = useGame();
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
  return (
    <>
      <PageHeader
        title={hunter.name}
        description={
          isPlayer
            ? "Sua própria ficha, como o resto da matilha a enxerga."
            : "Ficha de leitura: o que se sabe deste caçador pelo quadro do ranking."
        }
        action={
          <Tag tone={isPlayer ? "light" : "neutral"}>
            Melhor em {best.label} · {formatNumber(best.position)}º
          </Tag>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Panel title="Ficha" padding="none">
            <GenderBanner gender={hunter.gender} />
            <div className="space-y-2 border-b border-edge p-4">
              <div className="min-w-0">
                <p className="truncate text-sm text-ink">{hunter.name}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {hunter.gender === "male" ? "Macho" : "Fêmea"}
                </p>
              </div>
              <Tag tone="neutral">NV. {formatNumber(hunter.level)}</Tag>
            </div>

            <List>
              <DataRow label="Caçadas" value={formatNumber(hunter.hunts)} />
              <DataRow label="Vitórias" value={formatNumber(hunter.wins)} />
              <DataRow label="Derrotas" value={formatNumber(hunter.losses)} />
              <DataRow label="Bronze" value={formatNumber(hunter.bronze)} />
              <DataRow label="Forja" value={"+" + formatNumber(hunter.forge)} />
              <DataRow label="Mineração" value={"NV. " + formatNumber(hunter.mining)} />
            </List>
          </Panel>

          <Panel title="Mascote" padding="none">
            {wolf && hunter.pet ? <PetBanner gender={hunter.pet.gender} /> : null}
            {wolf && hunter.pet ? (
              <div className="flex items-center gap-3 p-4">
                <div className="min-w-0 space-y-2">
                  <div>
                    <p className="truncate text-sm text-ink">{hunter.pet.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      {wolf.label} · {wolf.title}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="px-4 py-3 text-xs text-ink-faint">Caça sozinho, sem lobo no rastro.</p>
            )}
          </Panel>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Panel
            title="Combate"
            description="Cada linha diz de qual atributo ela sai."
            padding="none"
          >
            <List>
              <DataRow label="Golpe (Força)" value={formatNumber(stats.totalAttributes.strength)} />
              <DataRow
                label="Defesa (Resistência)"
                value={formatNumber(stats.totalAttributes.endurance)}
              />
              <DataRow label="Esquiva (Agilidade)" value={stats.dodge + "%"} />
              <DataRow label="Crítico (Instinto)" value={stats.critical + "%"} />
              <DataRow label="Vida máxima" value={formatNumber(stats.maxHealth)} />
            </List>
          </Panel>

          <Panel
            title="Atributos"
            description="O que foi treinado, mais o que o resto empresta."
            padding="none"
          >
            <List>
              {ATTRIBUTES.map((definition) => {
                const base = hunter.attributes[definition.key];
                const bonus = stats.totalAttributes[definition.key] - base;
                return (
                  <ListRow key={definition.key} padding="art">
                    <AttributeIcon attribute={definition.key} />
                    <RowText title={definition.name} description={definition.description} />
                    <span className="font-mono text-sm text-ink">
                      {formatNumber(base)}
                      {bonus > 0 ? (
                        <span className="text-ink-faint"> +{formatNumber(bonus)}</span>
                      ) : null}
                    </span>
                  </ListRow>
                );
              })}
            </List>
          </Panel>

          <Panel
            title="Equipamento"
            description={
              "Os sete espaços, do elmo ao anel, somando +" +
              formatNumber(hunter.forge) +
              " de forja."
            }
            padding="none"
          >
            <List>
              {gear.map(({ slot, item, level }) => (
                <ListRow key={slot} padding="art">
                  {item ? <ItemIcon item={item} /> : <IconFrame>--</IconFrame>}
                  <RowText
                    title={item ? item.name : "Nada equipado"}
                    description={SLOT_LABEL[slot]}
                  />
                  {level > 0 ? <Tag tone="neutral">+{formatNumber(level)}</Tag> : null}
                  {item ? (
                    <span className="font-mono text-[11px] text-ink-faint">
                      {formatBronze(item.price)}
                    </span>
                  ) : null}
                </ListRow>
              ))}
            </List>
          </Panel>

          <Panel
            title="Posições"
            description={"Onde ele aparece em cada quadro, entre " + formatNumber(boardSize) + "."}
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
        </div>
      </div>
    </>
  );
}
