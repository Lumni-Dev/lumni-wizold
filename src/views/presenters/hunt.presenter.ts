import { hunterRetreated, hunterWon, type CombatOutcome } from "@/models/rules/combat";
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
  if (hunterWon(report.combat)) {
    return pick([prey + " tomba e não levanta mais.", prey + " cai. A noite fica quieta."]);
  }
  if (hunterRetreated(report.combat)) {
    return pick([
      "A luta se arrasta, e é hora de recuar.",
      prey + " aguenta firme. Melhor voltar.",
    ]);
  }
  return pick([prey + " leva a melhor desta vez.", "Ferido, resta escapar de " + prey + "."]);
}

export function preyBarCurrent(
  maximum: number,
  line: { creatureHealth: number } | null,
  replaying: boolean,
  filling: boolean,
  combat: CombatOutcome | null,
): number {
  if (replaying && line) return Math.max(0, Math.min(maximum, line.creatureHealth));
  if (filling) return maximum;
  if (!combat) return maximum;
  if (hunterWon(combat)) return 0;
  const last = combat.rounds[combat.rounds.length - 1];
  return Math.max(0, Math.min(maximum, last?.creatureHealth ?? maximum));
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
