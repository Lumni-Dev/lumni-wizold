import { SLOT_LABEL, type EquipmentSlot, type Item } from "@/models/entities/item";
import { ICON_FRAME_INSET } from "@/shared/constants/ui";
import { formatNumber } from "@/shared/utils/format";
import { cn } from "@/shared/utils/class-names";
import { IconFrame } from "./icon-frame";
import { ItemIcon } from "./item-icon";
import { Panel } from "./panel";

export interface GearSlot {
  slot: EquipmentSlot;
  item: Item | null;
  level: number;
}

export function EquipmentPanel({ gear, forge }: { gear: GearSlot[]; forge: number }) {
  return (
    <Panel
      title="Equipamento"
      description={
        "Os sete espaços, do elmo ao anel, somando +" + formatNumber(forge) + " de forja."
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {gear.map(({ slot, item, level }) => (
          <div
            key={slot}
            className={cn(
              "flex items-center gap-3 rounded-md border border-edge px-4 py-3",
              ICON_FRAME_INSET,
            )}
          >
            {item ? <ItemIcon item={item} enhancement={level} /> : <IconFrame tone="empty">--</IconFrame>}
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">{item ? item.name : "Nada equipado"}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                {SLOT_LABEL[slot]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
