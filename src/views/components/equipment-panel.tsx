import { SLOT_LABEL, type EquipmentSlot, type Item } from "@/models/entities/item";
import { formatNumber } from "@/shared/utils/format";
import { IconFrame } from "./icon-frame";
import { ItemIcon } from "./item-icon";
import { List, ListRow, RowText } from "./list";
import { Panel } from "./panel";

export interface GearSlot {
  slot: EquipmentSlot;
  item: Item | null;
  level: number;
}

// The equipment list with item art, shared by the character sheet and the
// read-only profile: each of the seven slots shows the drawing (with its forge
// badge), the piece name and the slot label.
export function EquipmentPanel({ gear, forge }: { gear: GearSlot[]; forge: number }) {
  return (
    <Panel
      title="Equipamento"
      description={
        "Os sete espaços, do elmo ao anel, somando +" + formatNumber(forge) + " de forja."
      }
      padding="none"
    >
      <List>
        {gear.map(({ slot, item, level }) => (
          <ListRow key={slot} padding="art">
            {item ? <ItemIcon item={item} enhancement={level} /> : <IconFrame>--</IconFrame>}
            <RowText
              title={item ? item.name : "Nada equipado"}
              description={SLOT_LABEL[slot]}
            />
          </ListRow>
        ))}
      </List>
    </Panel>
  );
}
