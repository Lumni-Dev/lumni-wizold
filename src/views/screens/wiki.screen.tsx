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
import { Panel } from "../components/panel";
import { AttributeIcon } from "../components/attribute-icon";
import { chipClass } from "../components/chip";
import { CreatureIcon } from "../components/creature-icon";
import { ItemIcon } from "../components/item-icon";
import { WikiMasonry, WikiMasonryItem } from "../components/wiki-masonry";
import { WikiPaginatedPanel } from "../components/wiki-paginated-panel";
import { PageHeader } from "../layout/page-header";
import { summarizeEffect } from "../presenters/item.presenter";

const SECTIONS: readonly { id: string; label: string }[] = [
  ...WIKI_TOPICS.map((topic) => ({ id: topic.id, label: topic.title })),
  { id: "attributes", label: "Atributos" },
  { id: "slots", label: "Espaços" },
  { id: "exercises", label: "Exercícios" },
  { id: "territories", label: "Territórios" },
  { id: "equipamentos", label: "Equipamentos" },
  { id: "bestiary", label: "Bestiário" },
  { id: "fragmentos", label: "Fragmentos" },
  { id: "itens", label: "Itens" },
  { id: "pocoes", label: "Poções" },
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

  const equipmentCount = WIKI_EQUIPMENT.length;

  return (
    <>
      <PageHeader
        title="Wiki"
        description="Todas as regras, números e catálogos do jogo em um lugar só."
      />

      <nav aria-label="Seções da wiki" className="mb-6 flex flex-wrap gap-2">
        {SECTIONS.map((section) => (
          <a key={section.id} href={"#" + section.id} className={chipClass()}>
            {section.label}
          </a>
        ))}
      </nav>

      <WikiMasonry>
        {WIKI_TOPICS.map((topic) => (
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

        <WikiMasonryItem id="attributes">
          <Panel title="Atributos" description="Cinco eixos, todos treináveis." padding="none">
            <List>
              {ATTRIBUTES.map((attribute) => (
                <ListRow key={attribute.key} padding="art">
                  <AttributeIcon attribute={attribute.key} />
                  <RowText title={attribute.name} description={attribute.effect} />
                </ListRow>
              ))}
            </List>
          </Panel>
        </WikiMasonryItem>

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

        <WikiPaginatedPanel
          id="equipamentos"
          title="Equipamentos"
          description={
            equipmentCount +
            " peças em cinco conjuntos, do bronze ao lunar. Cada linha traz a peça, o bônus e o preço no mercado."
          }
          items={WIKI_EQUIPMENT}
        >
          {(pageItems) =>
            pageItems.map(({ id, definition, slot }) => {
              const item = findItem(id);
              if (!item) return null;
              const bonuses = summarizeEffect(item).join(", ");
              return (
                <ListRow key={id} padding="art">
                  <ItemIcon item={item} />
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

        <WikiPaginatedPanel
          id="bestiary"
          title="Bestiário"
          description={
            WIKI_CREATURES.length +
            " criaturas em seis espécies, ordenadas por nível. Números fixos por variant."
          }
          items={WIKI_CREATURES}
        >
          {(pageItems) =>
            pageItems.map((creature) => (
              <ListRow key={creature.id} padding="art">
                <CreatureIcon creature={creature} />
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

        <WikiPaginatedPanel
          id="fragmentos"
          title="Fragmentos"
          description={
            WIKI_FRAGMENTS.length +
            " lascas da mina, uma por conjunto. Só alimentam a forja; não caem na caça nem entram no mercado."
          }
          items={WIKI_FRAGMENTS}
        >
          {(pageItems) =>
            pageItems.map((item) => (
              <ListRow key={item.id} padding="art">
                <ItemIcon item={item} />
                <RowText title={item.name} description={wikiItemDescription(item)} />
                <span className="shrink-0 font-mono text-[11px] text-ink-faint">mina</span>
              </ListRow>
            ))
          }
        </WikiPaginatedPanel>

        <WikiPaginatedPanel
          id="itens"
          title="Itens"
          description={
            WIKI_ITEMS.length + " materiais de caça e suprimentos de mascote no catálogo."
          }
          items={WIKI_ITEMS}
        >
          {(pageItems) =>
            pageItems.map((item) => (
              <ListRow key={item.id} padding="art">
                <ItemIcon item={item} />
                <RowText title={item.name} description={wikiItemDescription(item)} />
                <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                  {item.inMarket ? formatBronze(marketPriceOf(item, level)) : "drop"}
                </span>
              </ListRow>
            ))
          }
        </WikiPaginatedPanel>

        <WikiPaginatedPanel
          id="pocoes"
          title="Poções"
          description={WIKI_POTIONS.length + " poções de vida e fúria vendidas no mercado."}
          items={WIKI_POTIONS}
        >
          {(pageItems) =>
            pageItems.map((item) => (
              <ListRow key={item.id} padding="art">
                <ItemIcon item={item} />
                <RowText title={item.name} description={wikiItemDescription(item)} />
                <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                  {formatBronze(marketPriceOf(item, level))}
                </span>
              </ListRow>
            ))
          }
        </WikiPaginatedPanel>
      </WikiMasonry>
    </>
  );
}
