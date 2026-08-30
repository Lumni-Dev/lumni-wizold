import { SLOT_LABEL, type EquipmentSlot, type Item } from "@/models/entities/item";
import { formatNumber } from "@/shared/utils/format";
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
      <div className="grid gap-3 sm:grid-cols-2">
        {gear.map(({ slot, item, level }) => (
          <div key={slot} className="flex items-center gap-3 rounded-md border border-edge p-3">
            {item ? <ItemIcon item={item} enhancement={level} /> : <IconFrame>--</IconFrame>}
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
