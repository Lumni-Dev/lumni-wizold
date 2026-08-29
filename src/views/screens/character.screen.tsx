"use client";

import { useGame } from "@/controllers/game.context";
import { criticalMultiplierOf } from "@/models/rules/combat";
import { ATTRIBUTES, type Attributes } from "@/models/entities/attribute";
import { findItem } from "@/models/data/items";
import { enhancedName, enhancementOf } from "@/models/rules/forge";
import { EQUIPMENT_SLOTS, SLOT_LABEL } from "@/models/entities/item";
import { findGender, FORM_LABEL } from "@/models/entities/character";
import { BASE_ATTRIBUTE_VALUE } from "@/shared/constants/game";
import { cn } from "@/shared/utils/class-names";
import { formatNumber } from "@/shared/utils/format";
import { Bar } from "../components/bar";
import { Tag } from "../components/tag";
import { DataRow } from "../components/data-row";
import { AttributeIcon } from "../components/attribute-icon";
import { GenderBanner } from "../components/gender-icon";
import { VitalActionButton } from "../components/vital-action-button";
import { List, ListRow, RowText } from "../components/list";
import { Panel } from "../components/panel";
import { ActivityLog } from "../components/activity-log";
import { PageHeader } from "../layout/page-header";

function plus(value: number): string {
  return value > 0 ? "+" + formatNumber(value) : "0";
}

export function CharacterScreen() {
  const { state, character, stats, activity } = useGame();
  if (!character || !stats) return null;

  const strength = stats.totalAttributes.strength;
  const endurance = stats.totalAttributes.endurance;

  const genderDefinition = findGender(character.gender);
  const resting = activity?.kind === "rest";

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
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Panel title="Ficha" padding="none">
            <GenderBanner gender={character.gender} />
            <div className="space-y-2 border-b border-edge p-4">
              <div className="min-w-0">
                <p className="truncate text-sm text-ink">{character.name}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {genderDefinition.title}
                </p>
              </div>
              <Tag tone="neutral">{FORM_LABEL[character.form]}</Tag>
            </div>

            <List>
              <DataRow label="Linhagem" value={genderDefinition.label} />
              <DataRow label="NV." value={formatNumber(character.level)} />
              <DataRow
                label="Experiência"
                value={
                  formatNumber(character.experience) + " / " + formatNumber(stats.experienceNeeded)
                }
              />
              <DataRow label="Bronze" value={formatNumber(character.bronze)} />
              <DataRow label="Caçadas" value={formatNumber(character.hunts)} />
              <DataRow label="Vitórias" value={formatNumber(character.wins)} />
              <DataRow label="Derrotas" value={formatNumber(character.losses)} />
            </List>
          </Panel>

          <Panel
            title="Combate"
            description="Não há número escondido aqui: cada linha diz de qual atributo ela sai."
            padding="none"
          >
            <List>
              <DataRow label="Golpe (Força)" value={formatNumber(strength)} />
              <DataRow label="Defesa (Resistência)" value={formatNumber(endurance)} />
              <DataRow label="Esquiva (Agilidade)" value={stats.dodge + "%"} />
              <DataRow label="Crítico (Instinto)" value={stats.critical + "%"} />
              <DataRow
                label="Dano do crítico (Fúria)"
                value={"×" + criticalMultiplierOf(character.rage).toFixed(2).replace(".", ",")}
              />
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

          <Panel
            title="Atributos"
            description="Tudo o que o jogo usa está nesta tabela. Some as colunas e você chega no total."
            padding="none"
          >
            <List>
              {ATTRIBUTES.map((definition) => {
                const lent = (from: Attributes) => from[definition.key];
                const total = stats.totalAttributes[definition.key];

                const natural =
                  BASE_ATTRIBUTE_VALUE + (genderDefinition.bonus[definition.key] ?? 0);
                const cells = [
                  { label: "Natural", value: formatNumber(natural), sum: false },
                  {
                    label: "Treino",
                    value: plus(lent(stats.sources.trained) - natural),
                    sum: false,
                  },
                  { label: "Equip.", value: plus(lent(stats.sources.equipment)), sum: false },
                  { label: "Lobo", value: plus(lent(stats.sources.pet)), sum: false },
                  { label: "Lua", value: plus(lent(stats.sources.moon)), sum: false },
                  { label: "Fera", value: plus(lent(stats.sources.form)), sum: false },
                  { label: "Total", value: formatNumber(total), sum: true },
                ];

                return (
                  <ListRow key={definition.key} layout="column" padding="art">
                    <div className="flex min-w-0 items-center gap-3">
                      <AttributeIcon attribute={definition.key} />
                      <RowText title={definition.name} description={definition.description} />
                    </div>
                    <div className="grid w-full grid-cols-4 divide-x divide-y divide-edge sm:grid-cols-7 sm:divide-y-0 overflow-hidden rounded-md border border-edge">
                      {cells.map((cell) => (
                        <div
                          key={cell.label}
                          className={cn(
                            "space-y-0.5 px-2 py-1.5 text-center",
                            cell.sum && "bg-surface-high/40",
                          )}
                        >
                          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                            {cell.label}
                          </p>
                          <p
                            className={cn(
                              "font-mono text-[11px]",
                              cell.value === "0" ? "text-ink-faint" : "text-ink",
                            )}
                          >
                            {cell.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ListRow>
                );
              })}
            </List>
          </Panel>

          <Panel title="Equipamento" description="Trocas são feitas no inventário." padding="none">
            <List>
              {EQUIPMENT_SLOTS.map((slot) => {
                const itemId = state.equipment[slot];
                const item = itemId ? findItem(itemId) : undefined;

                return (
                  <DataRow
                    key={slot}
                    label={SLOT_LABEL[slot]}
                    value={
                      item ? (
                        <span className="text-ink">
                          {enhancedName(item.name, enhancementOf(state.enhancements, item.id))}
                        </span>
                      ) : (
                        <span className="text-ink-faint">vazio</span>
                      )
                    }
                  />
                );
              })}
            </List>
          </Panel>
        </div>
      </div>

      <ActivityLog entries={state.log} />
    </>
  );
}
