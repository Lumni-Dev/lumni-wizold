import type { EquipmentSlot } from "@/models/entities/item";
import type { SlotBlueprint } from "./types";

export const SLOTS: Record<EquipmentSlot, SlotBlueprint> = {
  helmet: {
    noun: "Cap",
    feminine: false,
    flavor:
      "Fur-lined leather with the flaps tied under the chin. It hides what the face " +
      "gives away when the beast starts to rise, and on a full night that spares explanations.",
    attributes: { endurance: 0.35, instinct: 0.15 },  },
  necklace: {
    noun: "Necklace",
    feminine: false,
    flavor:
      "It hangs over the chest and keeps the instinct awake even far from the trail. The " +
      "metal warms an instant before the prey appears, and the pack learned to trust that.",
    attributes: { instinct: 0.4, willpower: 0.3 },  },
  armor: {
    noun: "Coat",
    feminine: false,
    flavor:
      "Heavy leather and a fur collar covering the torso, which is where a beast aims " +
      "when it recognizes another. It is the piece that decides whether the bite becomes a scar to tell.",
    attributes: { endurance: 0.75 },  },
  pants: {
    noun: "Pants",
    feminine: true,
    flavor:
      "Reinforced legs for the four-pawed run and the two-legged fall. In a long " +
      "chase, what gives first is never the arm.",
    attributes: { endurance: 0.45, agility: 0.2 },  },
  boots: {
    noun: "Boots",
    feminine: true,
    flavor:
      "A firm sole for stone, mud and wet rooftops, loose enough for the foot that " +
      "grows in the turning. Reaching is half the hunt.",
    attributes: { agility: 0.5 },  },
  claw: {
    noun: "Gloves",
    feminine: true,
    flavor:
      "Metal fangs for the fingers, useful on nights when yours have not come out yet. " +
      "It is the pack's blow, and the hand forgets it is armed until it sees the damage.",
    attributes: { strength: 1 },  },
  ring: {
    noun: "Ring",
    feminine: false,
    flavor:
      "Small, discreet, and still heavy in the hand. It squeezes the finger when the " +
      "fury climbs, like a short collar reminding who commands whom.",
    attributes: { strength: 0.25, willpower: 0.15 },  },
};

export const SLOT_ROLE: Record<EquipmentSlot, string> = {
  helmet: "Light endurance and perception attributes.",
  necklace: "Attributes only, no direct endurance.",
  armor: "The set's biggest slice of endurance.",
  pants: "Medium endurance with an agility gain.",
  boots: "Low endurance, high agility.",
  claw: "The main source of strength.",
  ring: "Attributes only, no direct endurance.",
};
