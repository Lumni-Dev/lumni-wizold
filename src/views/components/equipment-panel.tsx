import { useT } from "@/controllers/use-locale";
import { SLOT_LABEL, type EquipmentSlot, type Item } from "@/models/entities/item";
import { formatNumber } from "@/shared/utils/format";
import { cn } from "@/shared/utils/class-names";
import { summarizeEffect } from "../presenters/item.presenter";
import { ItemArtFill } from "./item-icon";
import { Panel } from "./panel";

export interface GearSlot {
  slot: EquipmentSlot;
  item: Item | null;
  level: number;
}

export function EquipmentPanel({ gear, forge }: { gear: GearSlot[]; forge: number }) {
  const t = useT();
  return (
    <Panel
      title="Equipment"
      description={
        "The seven slots, helm to ring, adding +" + formatNumber(forge) + " of forge."
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {gear.map(({ slot, item, level }) => (
          <div
            key={slot}
            className={cn(
              "flex items-stretch overflow-hidden rounded-md border border-edge",
              !item && "border-dashed",
            )}
          >
            <span
              className={cn(
                "flex aspect-square w-16 shrink-0 overflow-hidden border-r border-edge p-2 sm:w-20",
                !item && "border-dashed",
              )}
            >
              {item ? (
                <ItemArtFill item={item} enhancement={level} />
              ) : (
                <span aria-hidden className="h-full w-full" />
              )}
            </span>
            <div className="flex min-w-0 grow items-center px-4 py-3">
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm text-ink">
                  {item ? t(item.name) : t("Nothing equipped")}
                </p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {t(SLOT_LABEL[slot])}
                </p>
                {item ? (
                  <p className="font-mono text-[11px] text-ink-soft">
                    {summarizeEffect(item, level)
                      .map((line) => t(line))
                      .join(" · ")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
