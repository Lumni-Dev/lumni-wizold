"use client";

import { marketPriceOf } from "@/controllers/market.controller";
import { useGame } from "@/controllers/game.context";
import { CREATURES } from "@/models/data/creatures";
import {
  EQUIPMENT_SETS,
  pieceId,
  pieceName,
  piecePrice,
  type SetDefinition,
} from "@/models/data/equipment-sets";
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
  type EquipmentSlot,
  type Item,
  type ItemCategory,
} from "@/models/entities/item";
import { DANGER_LABEL } from "@/models/entities/territory";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { Tag } from "../components/tag";
import { Panel } from "../components/panel";
import { AttributeIcon } from "../components/attribute-icon";
import { chipClass } from "../components/chip";
import { CreatureIcon } from "../components/creature-icon";
import { ItemIcon } from "../components/item-icon";
import { IconFrame } from "../components/icon-frame";
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

const TILE =
  "flex items-start gap-2 rounded-md border border-edge bg-surface-high/20 p-2";

const TILE_GRID =
  "grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5";

const PANEL_GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

function itemsOfCategory(category: ItemCategory) {
  return ITEMS.filter((item) => item.category === category);
}

function WikiItemTile({ item, level }: { item: Item; level: number }) {
  const effects = summarizeEffect(item);

  return (
    <div className={TILE}>
      <ItemIcon item={item} size="mini" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs leading-snug text-ink">{item.name}</p>
        {effects.length > 0 ? (
          <p className="text-[10px] leading-snug text-ink-soft">{effects.join(", ")}</p>
        ) : item.description ? (
          <p className="text-[10px] leading-snug text-ink-faint">{item.description}</p>
        ) : null}
        <p className="text-[10px] text-ink-faint">
          {RARITY_LABEL[item.rarity]} · NV. {item.minLevel}+
        </p>
        <p className="font-mono text-[10px] text-ink-faint">
          {item.inMarket ? formatBronze(marketPriceOf(item, level)) : "drop"}
        </p>
      </div>
    </div>
  );
}

function WikiSetTile({
  definition,
  slot,
}: {
  definition: SetDefinition;
  slot: EquipmentSlot;
}) {
  const item = findItem(pieceId(definition.key, slot));
  const effects = item ? summarizeEffect(item) : [];

  return (
    <div className={TILE}>
      {item ? <ItemIcon item={item} size="mini" /> : <IconFrame size="mini">--</IconFrame>}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">{SLOT_LABEL[slot]}</p>
        <p className="text-xs leading-snug text-ink">{pieceName(definition, slot)}</p>
        {effects.length > 0 ? (
          <p className="text-[10px] leading-snug text-ink-soft">{effects.join(", ")}</p>
        ) : null}
        <p className="font-mono text-[10px] text-ink-faint">
          {formatBronze(piecePrice(definition, slot))}
        </p>
      </div>
    </div>
  );
}

export function WikiScreen() {
  const { character } = useGame();
  const level = character?.level ?? 1;

  return (
    <div className="space-y-6">
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

      <div className={PANEL_GRID}>
        {WIKI_TOPICS.map((topic) => (
          <Panel
            key={topic.id}
            id={topic.id}
            title={topic.title}
            description={topic.summary}
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
          <div className={TILE_GRID + " lg:grid-cols-5"}>
            {ATTRIBUTES.map((attribute) => (
              <div key={attribute.key} className={TILE}>
                <AttributeIcon attribute={attribute.key} size="mini" />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-xs text-ink">{attribute.name}</p>
                  <p className="text-[10px] leading-snug text-ink-faint">{attribute.effect}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div id="slots" className="scroll-mt-28">
        <Panel
          title="Espaços de equipamento"
          description="Um item por espaço, sete no total."
          padding="none"
        >
          <div className={TILE_GRID + " lg:grid-cols-4 xl:grid-cols-7"}>
            {EQUIPMENT_SLOTS.map((slot) => (
              <div key={slot} className={TILE}>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-xs text-ink">{SLOT_LABEL[slot]}</p>
                  <p className="text-[10px] leading-snug text-ink-faint">{SLOT_ROLE[slot]}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div id="sets" className={"scroll-mt-28 " + PANEL_GRID}>
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
            <div className={TILE_GRID}>
              {EQUIPMENT_SLOTS.map((slot) => (
                <WikiSetTile key={slot} definition={definition} slot={slot} />
              ))}
            </div>
          </Panel>
        ))}
      </div>

      <div id="exercises" className="scroll-mt-28">
        <Panel
          title="Exercícios"
          description="Um por atributo, do primeiro ao último nível."
          padding="none"
        >
          <div className={TILE_GRID + " lg:grid-cols-5"}>
            {EXERCISES.map((exercise) => (
              <div key={exercise.id} className={TILE}>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs text-ink">{exercise.name}</p>
                    <p className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      {findAttribute(exercise.attribute)?.name ?? exercise.attribute}
                    </p>
                  </div>
                  <p className="text-[10px] leading-snug text-ink-faint">{exercise.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-edge px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              Rendimento da sessão
            </p>
            <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid gap-2 p-4 lg:grid-cols-2">
            {TERRITORIES.map((territory) => (
              <div key={territory.id} className={TILE}>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs text-ink">{territory.name}</p>
                    <Tag tone="faint">{DANGER_LABEL[territory.danger]}</Tag>
                    <Tag tone="neutral">
                      NV. {formatNumber(territory.minLevel)} a {formatNumber(territory.maxLevel)}
                    </Tag>
                    <Tag tone="neutral">{SPECIES_LABEL[territory.species]}</Tag>
                  </div>
                  <p className="text-[10px] leading-snug text-ink-faint">{territory.description}</p>
                  <p className="text-[10px] leading-snug text-ink-soft">
                    {territory.creatures
                      .map(
                        (creatureId) =>
                          CREATURES.find((creature) => creature.id === creatureId)?.name,
                      )
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div id="bestiary" className={"scroll-mt-28 " + PANEL_GRID}>
        {SPECIES_ORDER.map((species) => {
          const members = CREATURES.filter((creature) => creature.species === species);
          const band = members.length > 0 ? members[0].description : "";

          return (
            <Panel
              key={species}
              title={SPECIES_LABEL[species]}
              description={band}
              action={
                members.length > 0 ? (
                  <Tag tone="neutral">
                    NV. {formatNumber(members[0].level)} a{" "}
                    {formatNumber(members[members.length - 1].level)}
                  </Tag>
                ) : null
              }
              padding="none"
            >
              <div className={TILE_GRID + " md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"}>
                {members.map((creature) => (
                  <div key={creature.id} className={TILE}>
                    <CreatureIcon creature={creature} size="mini" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-xs text-ink">{creature.name}</p>
                        <span className="shrink-0 font-mono text-[10px] text-ink-faint">
                          NV. {formatNumber(creature.level)}
                        </span>
                      </div>
                      <p className="text-[10px] leading-snug text-ink-soft">
                        {formatNumber(creature.health)} vida · {formatNumber(creature.strength)} força
                        · {formatNumber(creature.endurance)} resist ·{" "}
                        {formatNumber(creature.agility)} agi
                      </p>
                      <p className="text-[10px] text-ink-faint">
                        +{formatNumber(creature.experience)} exp ·{" "}
                        {formatNumber(creature.minBronze)} a {formatBronze(creature.maxBronze)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {members.length > 0 ? (
                <div className="border-t border-edge px-4 py-3">
                  <p className="text-[10px] leading-snug text-ink-faint">
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

      <div id="catalog" className={"scroll-mt-28 " + PANEL_GRID}>
        {ITEM_CATEGORIES.map((category) => (
          <Panel
            key={category}
            title={CATEGORY_PLURAL[category]}
            description={itemsOfCategory(category).length + " itens no catálogo."}
            padding="none"
          >
            <div className={TILE_GRID}>
              {itemsOfCategory(category).map((item) => (
                <WikiItemTile key={item.id} item={item} level={level} />
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
