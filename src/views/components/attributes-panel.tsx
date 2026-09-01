import { ATTRIBUTES, type Attributes } from "@/models/entities/attribute";
import { findGender, type Gender } from "@/models/entities/character";
import type { DerivedStats } from "@/models/rules/stats";
import { BASE_ATTRIBUTE_VALUE } from "@/shared/constants/game";
import { cn } from "@/shared/utils/class-names";
import { formatNumber } from "@/shared/utils/format";
import { AttributeIcon } from "./attribute-icon";
import { List, ListRow, RowText } from "./list";
import { Panel } from "./panel";

function plus(value: number): string {
  return value > 0 ? "+" + formatNumber(value) : "0";
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
      title="Atributos"
      description="Cada coluna diz de onde vem o atributo. Some as colunas e você chega no total."
      padding="none"
    >
      <List>
        {ATTRIBUTES.map((definition) => {
          const lent = (from: Attributes) => from[definition.key];
          const total = stats.totalAttributes[definition.key];
          const natural = BASE_ATTRIBUTE_VALUE + (genderBonus[definition.key] ?? 0);
          const cells = [
            { label: "Natural", value: formatNumber(natural), sum: false },
            { label: "Treino", value: plus(lent(stats.sources.trained) - natural), sum: false },
            { label: "Equipamento", value: plus(lent(stats.sources.equipment)), sum: false },
            { label: "Mascote", value: plus(lent(stats.sources.pet)), sum: false },
            { label: "Lua", value: plus(lent(stats.sources.moon)), sum: false },
            { label: "Fúria", value: plus(lent(stats.sources.fury)), sum: false },
            { label: "Total", value: formatNumber(total), sum: true },
          ];

          return (
            <ListRow key={definition.key} layout="column" padding="art">
              <div className="flex min-w-0 items-start gap-3">
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
