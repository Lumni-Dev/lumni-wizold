import type { CombatOutcome } from "@/models/rules/combat";
import { pickOne } from "@/shared/utils/random";

export interface NarratedFight {
  foe: { name: string; health: number };
  combat: CombatOutcome;
}

export interface NarrationLine {
  text: string;
  blow: "ours" | "pet" | "theirs" | null;
  critical: boolean;
  creatureHealth: number;
  characterHealth?: number;
}

function pick(pool: string[]): string {
  return pickOne(pool);
}

function closerOf(report: NarratedFight, prey: string): string {
  if (report.combat.victory) {
    return pick([prey + " tomba e não levanta mais.", prey + " cai. A noite fica quieta."]);
  }
  if (report.combat.retreated) {
    return pick([
      "A luta se arrasta, e é hora de recuar.",
      prey + " aguenta firme. Melhor voltar.",
    ]);
  }
  return pick([prey + " leva a melhor desta vez.", "Ferido, resta escapar de " + prey + "."]);
}

export function narrationOf(report: NarratedFight): NarrationLine[] {
  const prey = report.foe.name;
  const full = report.foe.health;

  const middle: NarrationLine[] = report.combat.rounds.map((round) => ({
    text: round.text,
    blow: round.dodged
      ? null
      : round.author === "creature"
        ? "theirs"
        : round.author === "pet"
          ? "pet"
          : "ours",
    critical: round.critical,
    creatureHealth: round.creatureHealth,
    characterHealth: round.characterHealth,
  }));

  const last = middle[middle.length - 1]?.creatureHealth ?? full;

  return [
    ...middle,
    { text: closerOf(report, prey), blow: null, critical: false, creatureHealth: last },
  ];
}

export function emphasizeDamage(text: string): (string | { damage: string })[] {
  return text
    .split(/(\d+ de dano(?: crítico)?)/)
    .filter((part) => part.length > 0)
    .map((part) => (/^\d+ de dano/.test(part) ? { damage: part } : part));
}
