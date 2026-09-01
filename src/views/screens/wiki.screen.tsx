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

const WIKI_ITEMS: readonly Item[] = [...itemsOfCategory("material"), ...itemsOfCategory("pet")];

const WIKI_POTIONS: readonly Item[] = itemsOfCategory("potion");

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
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm text-ink">{attribute.name}</p>
                    <p className="text-[11px] leading-relaxed text-ink-faint">{attribute.effect}</p>
                  </div>
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
                  <div className="min-w-0 flex-1">
                    <RowText title={SLOT_LABEL[slot]} description={SLOT_ROLE[slot]} />
                  </div>
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
            " peças em cinco conjuntos, do bronze ao lunar. Cada linha traz espaço, bônus e preço no mercado."
          }
          items={WIKI_EQUIPMENT}
          header={<SetTableHeader />}
        >
          {(pageItems) =>
            pageItems.map(({ id, definition, slot }) => {
              const item = findItem(id);
              return (
                <ListRow key={id} padding="text">
                  <div className={SET_GRID}>
                    <span className="truncate text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      {SLOT_LABEL[slot]}
                    </span>
                    <span className="min-w-0 truncate text-sm text-ink">
                      {pieceName(definition, slot)}
                      <span className="text-ink-faint"> · {definition.label}</span>
                    </span>
                    <span className="hidden min-w-0 truncate text-[11px] text-ink-soft sm:block">
                      {item ? summarizeEffect(item).join(", ") : "—"}
                    </span>
                    <span className="truncate text-right font-mono text-[11px] text-ink-faint">
                      {formatBronze(piecePrice(definition, slot))}
                    </span>
                  </div>
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
              <ListRow key={creature.id} padding="art" className="items-start">
                <CreatureIcon creature={creature} />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3">
                    <p className="truncate text-sm text-ink">{creature.name}</p>
                    <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                      NV. {formatNumber(creature.level)}
                    </span>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    {SPECIES_LABEL[creature.species]}
                  </p>
                  <p className="font-mono text-[11px] leading-relaxed text-ink-soft">
                    {formatNumber(creature.health)} vida · {formatNumber(creature.strength)} força ·{" "}
                    {formatNumber(creature.endurance)} resistência ·{" "}
                    {formatNumber(creature.agility)} agilidade
                  </p>
                  <p className="font-mono text-[11px] text-ink-faint">
                    +{formatNumber(creature.experience)} exp · {formatNumber(creature.minBronze)} a{" "}
                    {formatBronze(creature.maxBronze)}
                  </p>
                </div>
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
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3">
                    <p className="truncate text-sm text-ink">{item.name}</p>
                    <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                      {item.inMarket ? formatBronze(marketPriceOf(item, level)) : "drop"}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-ink-soft">
                    {RARITY_LABEL[item.rarity]}, NV. {item.minLevel}+
                    {summarizeEffect(item).length > 0
                      ? " · " + summarizeEffect(item).join(", ")
                      : ""}
                  </p>
                </div>
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
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3">
                    <p className="truncate text-sm text-ink">{item.name}</p>
                    <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                      {formatBronze(marketPriceOf(item, level))}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-ink-soft">
                    {RARITY_LABEL[item.rarity]}, NV. {item.minLevel}+
                    {summarizeEffect(item).length > 0
                      ? " · " + summarizeEffect(item).join(", ")
                      : ""}
                  </p>
                </div>
              </ListRow>
            ))
          }
        </WikiPaginatedPanel>
      </WikiMasonry>
    </>
  );
}
