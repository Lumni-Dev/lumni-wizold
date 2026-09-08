"use client";

import { useMemo, useState } from "react";
import { marketPriceOf } from "@/controllers/market.controller";
import { useGame } from "@/controllers/game.context";
import { useT } from "@/controllers/use-locale";
import { normalizeText } from "@/shared/utils/text";
import { CREATURES } from "@/models/data/creatures";
import { EQUIPMENT_SETS, pieceId, pieceName, piecePrice } from "@/models/data/equipment-sets";
import { SLOT_ROLE } from "@/models/data/equipment/slots";
import { EXERCISES } from "@/models/data/exercises";
import { trainingEffort } from "@/models/rules/training";
import { findItem, ITEMS } from "@/models/data/items";
import { TERRITORIES } from "@/models/data/territories";
import { type WikiTopic } from "@/models/data/wiki";
import { wikiTopics } from "@/models/data/wiki.i18n";
import { useLocale } from "@/controllers/use-locale";
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
import { TerritoryArtFill } from "../components/territory-icon";
import { TrainingArtFill } from "../components/training-icon";
import { ItemArtFill } from "../components/item-icon";
import { WikiMasonry, WikiMasonryItem } from "../components/wiki-masonry";
import { WikiPaginatedPanel } from "../components/wiki-paginated-panel";
import { PageHeader } from "../layout/page-header";
import { showsRarity, summarizeEffect } from "../presenters/item.presenter";

const FIXED_TABS: readonly { key: string; label: string }[] = [
  { key: "attributes", label: "Attributes" },
  { key: "slots", label: "Slots" },
  { key: "exercises", label: "Exercises" },
  { key: "territories", label: "Territories" },
  { key: "equipamentos", label: "Equipment" },
  { key: "bestiary", label: "Bestiary" },
  { key: "fragmentos", label: "Fragments" },
  { key: "itens", label: "Items" },
  { key: "pocoes", label: "Potions" },
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
  const base = showsRarity(item)
    ? RARITY_LABEL[item.rarity] + ", LV. " + item.minLevel + "+"
    : "LV. " + item.minLevel + "+";
  return effects.length > 0 ? base + " · " + effects.join(", ") : base;
}

export function WikiScreen() {
  const { character } = useGame();
  const t = useT();
  const locale = useLocale();
  const topics = useMemo(() => wikiTopics(locale), [locale]);
  const sectionTabs = useMemo(
    () => [
      { key: "all", label: "All" },
      ...topics.map((topic) => ({ key: topic.id, label: topic.title })),
      ...FIXED_TABS,
    ],
    [topics],
  );
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

  function topicHit(topic: WikiTopic): boolean {
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
        description="Every rule, number and catalog of the game in one place."
      />

      <div className="mb-6 space-y-3">
        <div className="sm:max-w-xs">
          <Field
            accent
            aria-label="Search the wiki"
            placeholder="Search piece, creature or item"
            value={search}
            autoComplete="off"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <ChipTabs tabs={sectionTabs} value={section} onChange={setSection} />
      </div>

      <WikiMasonry>
        {topics.filter((topic) => shows(topic.id, topicHit(topic))).map((topic) => (
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

        {shows("attributes", hits("Attributes")) ? (
          <WikiMasonryItem id="attributes">
            <Panel title="Attributes" description="Five axes, all trainable." padding="none">
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

        {shows("slots", hits("Slots")) ? (
          <WikiMasonryItem id="slots">
            <Panel
              title="Equipment slots"
              description="One item per slot, seven in total."
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
            title="Equipment"
            description={
              equipmentCount +
              " pieces in five sets, bronze to lunar. Each row carries the piece, the bonus and the market price."
            }
            items={equipment}
          >
            {(pageItems) =>
              pageItems.map(({ id, definition, slot }) => {
                const item = findItem(id);
                if (!item) return null;
                const bonuses = summarizeEffect(item)
                  .map((line) => t(line))
                  .join(", ");
                return (
                  <ListRow key={id} art={<ItemArtFill item={item} />}>
                    <RowText
                      title={t(pieceName(definition, slot))}
                      description={
                        t(SLOT_LABEL[slot]) + (bonuses ? " · " + bonuses : "")
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

        {shows("exercises", hits("Exercises")) ? (
          <WikiMasonryItem id="exercises">
            <Panel
              title="Exercises"
              description="One per attribute, from the first level to the last."
              padding="none"
            >
              <List>
                {EXERCISES.map((exercise) => (
                  <ListRow
                    key={exercise.id}
                    art={<TrainingArtFill attribute={exercise.attribute} />}
                  >
                    <RowText
                      label={findAttribute(exercise.attribute)?.name ?? exercise.attribute}
                      title={exercise.name}
                      description={exercise.description}
                    />
                  </ListRow>
                ))}
              </List>
              <div className="space-y-2 border-t border-edge px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {t("Session yield")}
                </p>
                <ul className="space-y-1">
                  {[1, 170, 340, 670, 1000].map((value) => (
                    <li key={value} className="font-mono text-[11px] text-ink-soft">
                      {t("Attribute") +
                        " " +
                        formatNumber(value) +
                        ": +" +
                        formatNumber(trainingEffort(value).progress) +
                        " " +
                        t("progress per session")}
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          </WikiMasonryItem>
        ) : null}

        {shows("territories", hits("Territories")) ? (
          <WikiMasonryItem id="territories">
            <Panel
              title="Territories"
              description="The hunt's natural order of progression."
              padding="none"
            >
              <List>
                {TERRITORIES.map((territory) => (
                  <ListRow
                    key={territory.id}
                    art={<TerritoryArtFill territory={territory} />}
                    layout="column"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-ink">{t(territory.name)}</p>
                      <Tag tone="faint">{DANGER_LABEL[territory.danger]}</Tag>
                      <Tag tone="neutral">
                        {"LV. " +
                          formatNumber(territory.minLevel) +
                          " to " +
                          formatNumber(territory.maxLevel)}
                      </Tag>
                      <Tag tone="neutral">{SPECIES_LABEL[territory.species]}</Tag>
                    </div>
                    <p className="text-xs text-ink-faint">{t(territory.description)}</p>
                    <p className="text-[11px] text-ink-soft">
                      {territory.creatures
                        .map((creatureId) => {
                          const creature = CREATURES.find((row) => row.id === creatureId);
                          return creature ? t(creature.name) : null;
                        })
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
            title="Bestiary"
            description={
              WIKI_CREATURES.length +
              " creatures in six species, ordered by level. Fixed numbers per variant."
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
                        <p className="leading-relaxed text-ink-faint">{t(creature.description)}</p>
                        <p className="font-mono leading-relaxed text-ink-soft">
                          {formatNumber(creature.health) +
                            " " +
                            t("health") +
                            " · " +
                            formatNumber(creature.strength) +
                            " " +
                            t("strength") +
                            " · " +
                            formatNumber(creature.endurance) +
                            " " +
                            t("endurance") +
                            " · " +
                            formatNumber(creature.agility) +
                            " " +
                            t("agility")}
                        </p>
                        <p className="font-mono">
                          {"+" +
                            formatNumber(creature.experience) +
                            " exp · " +
                            formatNumber(creature.minBronze) +
                            " " +
                            t("to") +
                            " " +
                            formatBronze(creature.maxBronze)}
                        </p>
                      </>
                    }
                  />
                  <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                    {t("LV.")} {formatNumber(creature.level)}
                  </span>
                </ListRow>
              ))
            }
          </WikiPaginatedPanel>
        ) : null}

        {shows("fragmentos", fragments.length > 0) ? (
          <WikiPaginatedPanel
            id="fragmentos"
            title="Fragments"
            description={
              WIKI_FRAGMENTS.length +
              " shards from the mine, one per set. They only feed the forge; they do not drop on the hunt nor enter the market."
            }
            items={fragments}
          >
            {(pageItems) =>
              pageItems.map((item) => (
                <ListRow key={item.id} art={<ItemArtFill item={item} />}>
                  <RowText title={item.name} description={wikiItemDescription(item)} />
                  <span className="shrink-0 font-mono text-[11px] text-ink-faint">{t("mine")}</span>
                </ListRow>
              ))
            }
          </WikiPaginatedPanel>
        ) : null}

        {shows("itens", items.length > 0) ? (
          <WikiPaginatedPanel
            id="itens"
            title="Items"
            description={
              WIKI_ITEMS.length + " hunt materials and companion supplies in the catalog."
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
            title="Potions"
            description={WIKI_POTIONS.length + " health and fury potions sold at the market."}
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
