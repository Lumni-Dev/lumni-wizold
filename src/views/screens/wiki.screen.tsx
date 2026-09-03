"use client";

import { useMemo, useState } from "react";
import { marketPriceOf } from "@/controllers/market.controller";
import { useGame } from "@/controllers/game.context";
import { normalizeText } from "@/shared/utils/text";
import { CREATURES } from "@/models/data/creatures";
import { EQUIPMENT_SETS, pieceId, pieceName, piecePrice } from "@/models/data/equipment-sets";
import { SLOT_ROLE } from "@/models/data/equipment/slots";
import { EXERCISES } from "@/models/data/exercises";
import { trainingEffort } from "@/models/rules/training";
import { findItem, ITEMS } from "@/models/data/items";
import { TERRITORIES } from "@/models/data/territories";
import { WIKI_TOPICS } from "@/models/data/wiki";
import { ATTRIBUTES, findAttribute } from "@/models/entities/attribute";
import { SPECIES_LABEL } from "@/models/entities/creature";
import {
  EQUIPMENT_SLOTS,
  RARITY_LABEL,
  SLOT_LABEL,
  type EquipmentSlot,
  type Item,
  type ItemCategory,
} from "@/models/entities/item";
import type { SetDefinition } from "@/models/data/equipment";
import type { Creature } from "@/models/entities/creature";
import { isForgeMaterial } from "@/models/rules/bazaar";
import { DANGER_LABEL } from "@/models/entities/territory";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { Tag } from "../components/tag";
import { List, ListRow, RowText } from "../components/list";
import { Field } from "../components/field";
import { ChipTabs } from "../components/chip-tabs";
import { Panel } from "../components/panel";
import { AttributeArtFill } from "../components/attribute-icon";
import { CreatureArtFill } from "../components/creature-icon";
import { ItemArtFill } from "../components/item-icon";
import { WikiMasonry, WikiMasonryItem } from "../components/wiki-masonry";
import { WikiPaginatedPanel } from "../components/wiki-paginated-panel";
import { PageHeader } from "../layout/page-header";
import { summarizeEffect } from "../presenters/item.presenter";

const SECTION_TABS: readonly { key: string; label: string }[] = [
  { key: "all", label: "Tudo" },
  ...WIKI_TOPICS.map((topic) => ({ key: topic.id, label: topic.title })),
  { key: "attributes", label: "Atributos" },
  { key: "slots", label: "Espaços" },
  { key: "exercises", label: "Exercícios" },
  { key: "territories", label: "Territórios" },
  { key: "equipamentos", label: "Equipamentos" },
  { key: "bestiary", label: "Bestiário" },
  { key: "fragmentos", label: "Fragmentos" },
  { key: "itens", label: "Itens" },
  { key: "pocoes", label: "Poções" },
];

interface WikiEquipmentEntry {
  id: string;
  definition: SetDefinition;
  slot: EquipmentSlot;
}

const WIKI_EQUIPMENT: readonly WikiEquipmentEntry[] = EQUIPMENT_SETS.flatMap((definition) =>
  EQUIPMENT_SLOTS.map((slot) => ({
    id: pieceId(definition.key, slot),
    definition,
    slot,
  })),
);

const WIKI_CREATURES: readonly Creature[] = [...CREATURES].sort((left, right) => left.level - right.level);

function itemsOfCategory(category: ItemCategory): Item[] {
  return ITEMS.filter((item) => item.category === category);
}

const WIKI_FRAGMENTS: readonly Item[] = itemsOfCategory("material").filter(isForgeMaterial);

const WIKI_ITEMS: readonly Item[] = [
  ...itemsOfCategory("material").filter((item) => !isForgeMaterial(item)),
  ...itemsOfCategory("pet"),
];

const WIKI_POTIONS: readonly Item[] = itemsOfCategory("potion");

function wikiItemDescription(item: Item): string {
  const effects = summarizeEffect(item);
  const base = RARITY_LABEL[item.rarity] + ", NV. " + item.minLevel + "+";
  return effects.length > 0 ? base + " · " + effects.join(", ") : base;
}

export function WikiScreen() {
  const { character } = useGame();
  const level = character?.level ?? 1;
  const [section, setSection] = useState("loop");
  const [search, setSearch] = useState("");

  const wanted = normalizeText(search);
  const searching = wanted !== "";

  const equipment = useMemo(
    () =>
      wanted === ""
        ? WIKI_EQUIPMENT
        : WIKI_EQUIPMENT.filter((entry) =>
            normalizeText(pieceName(entry.definition, entry.slot)).includes(wanted),
          ),
    [wanted],
  );
  const creatures = useMemo(
    () =>
      wanted === ""
        ? WIKI_CREATURES
        : WIKI_CREATURES.filter((creature) => normalizeText(creature.name).includes(wanted)),
    [wanted],
  );
  const fragments = useMemo(
    () =>
      wanted === ""
        ? WIKI_FRAGMENTS
        : WIKI_FRAGMENTS.filter((item) => normalizeText(item.name).includes(wanted)),
    [wanted],
  );
  const items = useMemo(
    () =>
      wanted === "" ? WIKI_ITEMS : WIKI_ITEMS.filter((item) => normalizeText(item.name).includes(wanted)),
    [wanted],
  );
  const potions = useMemo(
    () =>
      wanted === ""
        ? WIKI_POTIONS
        : WIKI_POTIONS.filter((item) => normalizeText(item.name).includes(wanted)),
    [wanted],
  );

  function hits(text: string): boolean {
    return normalizeText(text).includes(wanted);
  }

  function topicHit(topic: (typeof WIKI_TOPICS)[number]): boolean {
    return hits(topic.title + " " + topic.summary + " " + topic.lines.join(" "));
  }

  function shows(id: string, matched = false): boolean {
    if (searching) return matched;
    return section === "all" || section === id;
  }

  const equipmentCount = WIKI_EQUIPMENT.length;

  return (
    <>
      <PageHeader
        title="Wiki"
        description="Todas as regras, números e catálogos do jogo em um lugar só."
      />

      <div className="mb-6 space-y-3">
        <div className="sm:max-w-xs">
          <Field
            accent
            aria-label="Buscar na wiki"
            placeholder="Buscar peça, criatura ou item"
            value={search}
            autoComplete="off"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <ChipTabs tabs={SECTION_TABS} value={section} onChange={setSection} />
      </div>

      <WikiMasonry>
        {WIKI_TOPICS.filter((topic) => shows(topic.id, topicHit(topic))).map((topic) => (
          <WikiMasonryItem key={topic.id} id={topic.id}>
            <Panel title={topic.title} description={topic.summary}>
              <ul className="space-y-2 text-xs leading-relaxed text-ink-soft">
                {topic.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Panel>
          </WikiMasonryItem>
        ))}

        {shows("attributes", hits("Atributos")) ? (
          <WikiMasonryItem id="attributes">
            <Panel title="Atributos" description="Cinco eixos, todos treináveis." padding="none">
              <List>
                {ATTRIBUTES.map((attribute) => (
                  <ListRow key={attribute.key} art={<AttributeArtFill attribute={attribute.key} />}>
                    <RowText title={attribute.name} description={attribute.effect} />
                  </ListRow>
                ))}
              </List>
            </Panel>
          </WikiMasonryItem>
        ) : null}

        {shows("slots", hits("Espaços")) ? (
          <WikiMasonryItem id="slots">
            <Panel
              title="Espaços de equipamento"
              description="Um item por espaço, sete no total."
              padding="none"
            >
              <List>
                {EQUIPMENT_SLOTS.map((slot) => (
                  <ListRow key={slot}>
                    <RowText title={SLOT_LABEL[slot]} description={SLOT_ROLE[slot]} />
                  </ListRow>
                ))}
              </List>
            </Panel>
          </WikiMasonryItem>
        ) : null}

        {shows("equipamentos", equipment.length > 0) ? (
          <WikiPaginatedPanel
            id="equipamentos"
            title="Equipamentos"
            description={
              equipmentCount +
              " peças em cinco conjuntos, do bronze ao lunar. Cada linha traz a peça, o bônus e o preço no mercado."
            }
            items={equipment}
          >
            {(pageItems) =>
              pageItems.map(({ id, definition, slot }) => {
                const item = findItem(id);
                if (!item) return null;
                const bonuses = summarizeEffect(item).join(", ");
                return (
                  <ListRow key={id} art={<ItemArtFill item={item} />}>
                    <RowText
                      title={
                        <>
                          {pieceName(definition, slot)}
                          <span className="text-ink-faint"> · {definition.label}</span>
                        </>
                      }
                      description={
                        SLOT_LABEL[slot] + (bonuses ? " · " + bonuses : "")
                      }
                    />
                    <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                      {formatBronze(piecePrice(definition))}
                    </span>
                  </ListRow>
                );
              })
            }
          </WikiPaginatedPanel>
        ) : null}

        {shows("exercises", hits("Exercícios")) ? (
          <WikiMasonryItem id="exercises">
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
          </WikiMasonryItem>
        ) : null}

        {shows("territories", hits("Territórios")) ? (
          <WikiMasonryItem id="territories">
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
          </WikiMasonryItem>
        ) : null}

        {shows("bestiary", creatures.length > 0) ? (
          <WikiPaginatedPanel
            id="bestiary"
            title="Bestiário"
            description={
              WIKI_CREATURES.length +
              " criaturas em seis espécies, ordenadas por nível. Números fixos por variant."
            }
            items={creatures}
          >
            {(pageItems) =>
              pageItems.map((creature) => (
                <ListRow key={creature.id} art={<CreatureArtFill creature={creature} />}>
                  <RowText
                    title={creature.name}
                    label={SPECIES_LABEL[creature.species]}
                    description={
                      <>
                        <p className="font-mono leading-relaxed text-ink-soft">
                          {formatNumber(creature.health)} vida · {formatNumber(creature.strength)} força ·{" "}
                          {formatNumber(creature.endurance)} resistência ·{" "}
                          {formatNumber(creature.agility)} agilidade
                        </p>
                        <p className="font-mono">
                          +{formatNumber(creature.experience)} exp · {formatNumber(creature.minBronze)} a{" "}
                          {formatBronze(creature.maxBronze)}
                        </p>
                      </>
                    }
                  />
                  <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                    NV. {formatNumber(creature.level)}
                  </span>
                </ListRow>
              ))
            }
          </WikiPaginatedPanel>
        ) : null}

        {shows("fragmentos", fragments.length > 0) ? (
          <WikiPaginatedPanel
            id="fragmentos"
            title="Fragmentos"
            description={
              WIKI_FRAGMENTS.length +
              " lascas da mina, uma por conjunto. Só alimentam a forja; não caem na caça nem entram no mercado."
            }
            items={fragments}
          >
            {(pageItems) =>
              pageItems.map((item) => (
                <ListRow key={item.id} art={<ItemArtFill item={item} />}>
                  <RowText title={item.name} description={wikiItemDescription(item)} />
                  <span className="shrink-0 font-mono text-[11px] text-ink-faint">mina</span>
                </ListRow>
              ))
            }
          </WikiPaginatedPanel>
        ) : null}

        {shows("itens", items.length > 0) ? (
          <WikiPaginatedPanel
            id="itens"
            title="Itens"
            description={
              WIKI_ITEMS.length + " materiais de caça e suprimentos de mascote no catálogo."
            }
            items={items}
          >
            {(pageItems) =>
              pageItems.map((item) => (
                <ListRow key={item.id} art={<ItemArtFill item={item} />}>
                  <RowText title={item.name} description={wikiItemDescription(item)} />
                  <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                    {item.inMarket ? formatBronze(marketPriceOf(item, level)) : "drop"}
                  </span>
                </ListRow>
              ))
            }
          </WikiPaginatedPanel>
        ) : null}

        {shows("pocoes", potions.length > 0) ? (
          <WikiPaginatedPanel
            id="pocoes"
            title="Poções"
            description={WIKI_POTIONS.length + " poções de vida e fúria vendidas no mercado."}
            items={potions}
          >
            {(pageItems) =>
              pageItems.map((item) => (
                <ListRow key={item.id} art={<ItemArtFill item={item} />}>
                  <RowText title={item.name} description={wikiItemDescription(item)} />
                  <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                    {formatBronze(marketPriceOf(item, level))}
                  </span>
                </ListRow>
              ))
            }
          </WikiPaginatedPanel>
        ) : null}
      </WikiMasonry>
    </>
  );
}
