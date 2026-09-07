import { ATTRIBUTES, type Attributes } from "@/models/entities/attribute";
import { findGender, type Gender } from "@/models/entities/character";
import type { DerivedStats } from "@/models/rules/stats";
import { BASE_ATTRIBUTE_VALUE } from "@/shared/constants/game";
import { cn } from "@/shared/utils/class-names";
import { formatFraction } from "@/shared/utils/format";
import { AttributeArtFill } from "./attribute-icon";
import { List, ListRow, RowText } from "./list";
import { Panel } from "./panel";

function plus(value: number): string {
  return value > 0 ? "+" + formatFraction(value) : "0";
}

export function AttributesPanel({
  stats,
  gender,
}: {
  stats: DerivedStats;
  gender: Gender;
}) {
  const genderBonus = findGender(gender).bonus;

  return (
    <Panel
      title="Attributes"
      description="Each column says where the attribute comes from. Add the columns and you reach the total."
      padding="none"
    >
      <List>
        {ATTRIBUTES.map((definition) => {
          const lent = (from: Attributes) => from[definition.key];
          const total = stats.totalAttributes[definition.key];
          const natural = BASE_ATTRIBUTE_VALUE + (genderBonus[definition.key] ?? 0);
          const cells = [
            { label: "Natural", value: formatFraction(natural), sum: false },
            { label: "Treino", value: plus(lent(stats.sources.trained) - natural), sum: false },
            { label: "Equip.", value: plus(lent(stats.sources.equipment)), sum: false },
            { label: "Mascote", value: plus(lent(stats.sources.pet)), sum: false },
            { label: "Lua", value: plus(lent(stats.sources.moon)), sum: false },
            { label: "Fury", value: plus(lent(stats.sources.fury)), sum: false },
            { label: "Total", value: formatFraction(total), sum: true },
          ];

          return (
            <ListRow
              key={definition.key}
              art={<AttributeArtFill attribute={definition.key} />}
              layout="column"
              padding="none"
            >
              <div className="px-4 py-3">
                <RowText title={definition.name} description={definition.description} />
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-edge border-t border-edge sm:grid-cols-4 lg:grid-cols-7 lg:divide-y-0">
                {cells.map((cell) => (
                  <div
                    key={cell.label}
                    className={cn(
                      "space-y-0.5 px-2 py-3 text-center",
                      cell.sum && "bg-surface-high/40",
                    )}
                  >
                    <p className="truncate text-[10px] uppercase tracking-normal text-ink-faint">
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
  );
}
