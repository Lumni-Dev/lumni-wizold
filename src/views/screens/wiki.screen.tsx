"use client";

import { CREATURES } from "@/models/data/creatures";
import { EQUIPMENT_SETS, pieceId, pieceName } from "@/models/data/equipment-sets";
import { EXERCISES } from "@/models/data/exercises";
import { trainingEffort } from "@/models/rules/training";
import { findItem, ITEMS } from "@/models/data/items";
import { TERRITORIES } from "@/models/data/territories";
import { WIKI_TOPICS } from "@/models/data/wiki";
import { ATTRIBUTES, findAttribute } from "@/models/entities/attribute";
import { SPECIES_LABEL, SPECIES_ORDER } from "@/models/entities/creature";
import {
  CATEGORY_PLURAL,
  EQUIPMENT_SLOTS,
  ITEM_CATEGORIES,
  RARITY_LABEL,
  SLOT_LABEL,
  type ItemCategory,
} from "@/models/entities/item";
import { DANGER_LABEL } from "@/models/entities/territory";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { Tag } from "../components/tag";
import { List, ListRow, RowText } from "../components/list";
import { Panel } from "../components/panel";
import { AttributeIcon } from "../components/attribute-icon";
import { chipClass } from "../components/chip";
import { ItemIcon } from "../components/item-icon";
import { PageHeader } from "../layout/page-header";
import { summarizeEffect } from "../presenters/item.presenter";

const SLOT_ROLE: Record<(typeof EQUIPMENT_SLOTS)[number], string> = {
  helmet: "Resistência leve e atributos de percepção.",
  necklace: "Somente atributos, sem resistência direta.",
  armor: "A maior fatia de resistência do conjunto.",
  pants: "Resistência média com ganho de agilidade.",
  boots: "Resistência baixa, agilidade alta.",
  claw: "Fonte principal de força.",
  ring: "Somente atributos, sem resistência direta.",
};

const SECTIONS: readonly { id: string; label: string }[] = [
  ...WIKI_TOPICS.map((topic) => ({ id: topic.id, label: topic.title })),
  { id: "attributes", label: "Atributos" },
  { id: "slots", label: "Espaços" },
  { id: "sets", label: "Conjuntos" },
  { id: "exercises", label: "Exercícios" },
  { id: "territories", label: "Territórios" },
  { id: "bestiary", label: "Bestiário" },
  { id: "catalog", label: "Catálogo" },
];

function itemsOfCategory(category: ItemCategory) {
  return ITEMS.filter((item) => item.category === category);
}

export function WikiScreen() {
  return (
    <>
      <PageHeader
        title="Wiki"
        description="Todas as regras, números e catálogos do jogo em um lugar só."
      />

      <nav aria-label="Seções da wiki" className="flex flex-wrap gap-2">
        {SECTIONS.map((section) => (
          <a key={section.id} href={"#" + section.id} className={chipClass()}>
            {section.label}
          </a>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        {WIKI_TOPICS.map((topic) => (
          <Panel
            key={topic.id}
            id={topic.id}
            title={topic.title}
            description={topic.summary}
            height="fill"
            className="scroll-mt-28"
          >
            <ul className="space-y-2">
              {topic.lines.map((line) => (
                <li key={line} className="flex gap-2 text-xs leading-relaxed text-ink-soft">
                  <span className="text-ink-faint">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      <div id="attributes" className="scroll-mt-28">
        <Panel title="Atributos" description="Cinco eixos, todos treináveis." padding="none">
          <List>
            {ATTRIBUTES.map((attribute) => (
              <ListRow key={attribute.key}>
                <AttributeIcon attribute={attribute.key} />
                <RowText title={attribute.name} description={attribute.effect} />
              </ListRow>
            ))}
          </List>
        </Panel>
      </div>

      <div id="slots" className="scroll-mt-28">
        <Panel
          title="Espaços de equipamento"
          description="Um item por espaço, sete no total."
          padding="none"
        >
          <List>
            {EQUIPMENT_SLOTS.map((slot) => (
              <ListRow key={slot} className="justify-between">
                <span className="text-sm text-ink">{SLOT_LABEL[slot]}</span>
                <span className="text-right text-[11px] text-ink-faint">{SLOT_ROLE[slot]}</span>
              </ListRow>
            ))}
          </List>
        </Panel>
      </div>

      <div id="sets" className="scroll-mt-28 space-y-6">
        {EQUIPMENT_SETS.map((definition) => (
          <Panel
            key={definition.key}
            title={"Conjunto " + definition.label}
            description={definition.description}
            action={
              <div className="flex flex-wrap justify-end gap-2">
                <Tag tone="neutral">NV. {definition.minLevel}+</Tag>
                <Tag tone={definition.inMarket ? "faint" : "light"}>
                  {definition.inMarket ? "No mercado" : "Somente drop"}
                </Tag>
              </div>
            }
            padding="none"
          >
            <List>
              {EQUIPMENT_SLOTS.map((slot) => {
                const item = findItem(pieceId(definition.key, slot));
                return (
                  <ListRow key={slot}>
                    <span className="w-24 shrink-0 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      {SLOT_LABEL[slot]}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">
                      {pieceName(definition, slot)}
                    </span>
                    <span className="hidden text-right text-[11px] text-ink-soft sm:block">
                      {item ? summarizeEffect(item).join(" · ") : null}
                    </span>
                    <span className="w-24 shrink-0 text-right font-mono text-[11px] text-ink-faint">
                      {item && item.inMarket ? formatBronze(item.price) : "drop"}
                    </span>
                  </ListRow>
                );
              })}
            </List>
          </Panel>
        ))}
      </div>

      <div id="exercises" className="scroll-mt-28">
        <Panel
          title="Exercícios"
          description="Um por atributo, do primeiro ao último nível."
          padding="none"
        >
          <List>
            {EXERCISES.map((exercise) => (
              <ListRow key={exercise.id} layout="split">
                <RowText title={exercise.name} description={exercise.description} />
                <p className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {findAttribute(exercise.attribute)?.name ?? exercise.attribute}
                </p>
              </ListRow>
            ))}
          </List>
          <div className="space-y-2 border-t border-edge px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              Rendimento da sessão
            </p>
            <ul className="space-y-1">
              {[1, 170, 340, 670, 1000].map((level) => (
                <li key={level} className="font-mono text-[11px] text-ink-soft">
                  NV. {formatNumber(level)} · +{formatNumber(trainingEffort(level).progress)}{" "}
                  progresso por sessão
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <div id="territories" className="scroll-mt-28">
        <Panel
          title="Territórios"
          description="Ordem natural de progressão da caça."
          padding="none"
        >
          <List>
            {TERRITORIES.map((territory) => (
              <ListRow key={territory.id} layout="column">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-ink">{territory.name}</p>
                  <Tag tone="faint">{DANGER_LABEL[territory.danger]}</Tag>
                  <Tag tone="neutral">
                    NV. {formatNumber(territory.minLevel)} a {formatNumber(territory.maxLevel)}
                  </Tag>
                  <Tag tone="neutral">{SPECIES_LABEL[territory.species]}</Tag>
                </div>
                <p className="text-xs text-ink-faint">{territory.description}</p>
                <p className="text-[11px] text-ink-soft">
                  {territory.creatures
                    .map(
                      (creatureId) =>
                        CREATURES.find((creature) => creature.id === creatureId)?.name,
                    )
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </ListRow>
            ))}
          </List>
        </Panel>
      </div>

      <div id="bestiary" className="scroll-mt-28 space-y-6">
        {SPECIES_ORDER.map((species) => {
          const members = CREATURES.filter((creature) => creature.species === species);
          const band = members.length > 0 ? members[0].description : "";

          return (
            <Panel
              key={species}
              title={SPECIES_LABEL[species]}
              description={band}
              action={
                <div className="flex items-center gap-2">
                  {members.length > 0 ? (
                    <Tag tone="neutral">
                      NV. {formatNumber(members[0].level)} a{" "}
                      {formatNumber(members[members.length - 1].level)}
                    </Tag>
                  ) : null}
                </div>
              }
              padding="none"
            >
              <List>
                {members.map((creature) => (
                  <ListRow key={creature.id} layout="column">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm text-ink">{creature.name}</p>
                      <span className="font-mono text-[11px] text-ink-faint">
                        NV. {formatNumber(creature.level)}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-ink-soft">
                      {formatNumber(creature.health)} vida · {formatNumber(creature.strength)} força
                      · {formatNumber(creature.endurance)} resistência ·{" "}
                      {formatNumber(creature.agility)} agilidade
                    </p>
                    <p className="font-mono text-[11px] text-ink-faint">
                      +{formatNumber(creature.experience)} exp · {formatNumber(creature.minBronze)}{" "}
                      a {formatBronze(creature.maxBronze)}
                    </p>
                  </ListRow>
                ))}
              </List>
              {members.length > 0 ? (
                <div className="border-t border-edge px-4 py-3">
                  <p className="text-[11px] text-ink-faint">
                    Loot:{" "}
                    {members[0].drops
                      .map(
                        (drop) =>
                          (findItem(drop.itemId)?.name ?? drop.itemId) +
                          " (" +
                          Math.round(drop.chance * 100) +
                          "%)",
                      )
                      .join(", ")}
                  </p>
                </div>
              ) : null}
            </Panel>
          );
        })}
      </div>

      <div id="catalog" className="scroll-mt-28 space-y-6">
        {ITEM_CATEGORIES.map((category) => (
          <Panel
            key={category}
            title={CATEGORY_PLURAL[category]}
            description={itemsOfCategory(category).length + " itens no catálogo."}
            padding="none"
          >
            <List>
              {itemsOfCategory(category).map((item) => (
                <ListRow key={item.id}>
                  <ItemIcon item={item} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm text-ink">{item.name}</p>
                      <span className="font-mono text-[11px] text-ink-faint">
                        {item.inMarket ? formatBronze(item.price) : "somente drop"}
                      </span>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      {RARITY_LABEL[item.rarity]} · NV. {item.minLevel}+
                    </p>
                    <p className="mt-1 text-[11px] text-ink-soft">
                      {summarizeEffect(item).join(" · ") || "Sem efeito, serve para venda."}
                    </p>
                  </div>
                </ListRow>
              ))}
            </List>
          </Panel>
        ))}
      </div>
    </>
  );
}
