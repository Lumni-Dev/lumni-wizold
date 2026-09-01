"use client";

import { marketPriceOf } from "@/controllers/market.controller";
import { useGame } from "@/controllers/game.context";
import { CREATURES } from "@/models/data/creatures";
import { EQUIPMENT_SETS, pieceId, pieceName, piecePrice } from "@/models/data/equipment-sets";
import { SLOT_ROLE } from "@/models/data/equipment/slots";
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
import { CreatureIcon } from "../components/creature-icon";
import { ItemIcon } from "../components/item-icon";
import { PageHeader } from "../layout/page-header";
import { summarizeEffect } from "../presenters/item.presenter";

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

const SET_GRID =
  "grid w-full grid-cols-[4.5rem_minmax(0,1fr)_4.5rem] items-center gap-x-3 sm:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,7rem)_4.5rem]";

function SetTableHeader() {
  return (
    <div
      className={
        SET_GRID +
        " border-b border-edge px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-ink-faint"
      }
    >
      <span>Espaço</span>
      <span>Peça</span>
      <span className="hidden sm:block">Bônus</span>
      <span className="text-right">Preço</span>
    </div>
  );
}

export function WikiScreen() {
  const { character } = useGame();
  const level = character?.level ?? 1;

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
            <ul className="space-y-1.5 text-xs leading-relaxed text-ink-soft">
              {topic.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      <div id="attributes" className="scroll-mt-28">
        <Panel title="Atributos" description="Cinco eixos, todos treináveis." padding="none">
          <List>
            {ATTRIBUTES.map((attribute) => (
              <ListRow key={attribute.key} padding="art">
                <AttributeIcon attribute={attribute.key} />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm text-ink">{attribute.name}</p>
                  <p className="text-[11px] leading-relaxed text-ink-faint">{attribute.effect}</p>
                </div>
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
              <ListRow key={slot}>
                <div className="min-w-0 flex-1">
                  <RowText title={SLOT_LABEL[slot]} description={SLOT_ROLE[slot]} />
                </div>
              </ListRow>
            ))}
          </List>
        </Panel>
      </div>

      <div id="sets" className="scroll-mt-28 grid gap-6 lg:grid-cols-2">
        {EQUIPMENT_SETS.map((definition) => (
          <Panel
            key={definition.key}
            title={"Conjunto " + definition.label}
            description={definition.description}
            action={
              <div className="flex flex-wrap justify-end gap-2">
                <Tag tone="neutral">NV. {definition.minLevel}+</Tag>
                {definition.inMarket ? <Tag tone="faint">No mercado</Tag> : null}
              </div>
            }
            padding="none"
          >
            <SetTableHeader />
            <List>
              {EQUIPMENT_SLOTS.map((slot) => {
                const item = findItem(pieceId(definition.key, slot));
                return (
                  <ListRow key={slot} layout="column">
                    <div className={SET_GRID}>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                        {SLOT_LABEL[slot]}
                      </span>
                      <span className="min-w-0 truncate text-sm text-ink">
                        {pieceName(definition, slot)}
                      </span>
                      <span className="hidden min-w-0 truncate text-[11px] text-ink-soft sm:block">
                        {item ? summarizeEffect(item).join(", ") : "—"}
                      </span>
                      <span className="text-right font-mono text-[11px] text-ink-faint">
                        {formatBronze(piecePrice(definition, slot))}
                      </span>
                    </div>
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
              <ListRow key={exercise.id} layout="column">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm text-ink">{exercise.name}</p>
                  <p className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    {findAttribute(exercise.attribute)?.name ?? exercise.attribute}
                  </p>
                </div>
                <p className="text-[11px] leading-relaxed text-ink-faint">{exercise.description}</p>
              </ListRow>
            ))}
          </List>
          <div className="space-y-2 border-t border-edge px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              Rendimento da sessão
            </p>
            <ul className="space-y-1">
              {[1, 170, 340, 670, 1000].map((value) => (
                <li key={value} className="font-mono text-[11px] text-ink-soft">
                  Atributo {formatNumber(value)}: +{formatNumber(trainingEffort(value).progress)}{" "}
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
                    .join(", ")}
                </p>
              </ListRow>
            ))}
          </List>
        </Panel>
      </div>

      <div id="bestiary" className="scroll-mt-28 grid gap-6 lg:grid-cols-2">
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
                  <ListRow key={creature.id} padding="art" className="items-start">
                    <CreatureIcon creature={creature} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3">
                        <p className="truncate text-sm text-ink">{creature.name}</p>
                        <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                          NV. {formatNumber(creature.level)}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] leading-relaxed text-ink-soft">
                        {formatNumber(creature.health)} vida · {formatNumber(creature.strength)}{" "}
                        força · {formatNumber(creature.endurance)} resistência ·{" "}
                        {formatNumber(creature.agility)} agilidade
                      </p>
                      <p className="font-mono text-[11px] text-ink-faint">
                        +{formatNumber(creature.experience)} exp · {formatNumber(creature.minBronze)}{" "}
                        a {formatBronze(creature.maxBronze)}
                      </p>
                    </div>
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
                <ListRow key={item.id} padding="art" className="items-start">
                  <ItemIcon item={item} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3">
                      <p className="truncate text-sm text-ink">{item.name}</p>
                      <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                        {item.inMarket
                          ? formatBronze(marketPriceOf(item, level))
                          : "somente drop"}
                      </span>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      {RARITY_LABEL[item.rarity]}, NV. {item.minLevel}+
                    </p>
                    <p className="text-[11px] leading-relaxed text-ink-soft">
                      {summarizeEffect(item).join(", ") || "Sem efeito, serve para venda."}
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
