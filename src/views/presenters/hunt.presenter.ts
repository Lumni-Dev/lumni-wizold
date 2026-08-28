import type { CombatOutcome } from "@/models/rules/combat";

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
  return pool[Math.floor(Math.random() * pool.length)];
}

function openerOf(hunter: string, prey: string): string {
  return pick([
    hunter + " fareja " + prey + " na escuridão.",
    hunter + " se aproxima baixo, sem quebrar um galho.",
    "Os olhos de " + prey + " brilham quando percebem " + hunter + ".",
    hunter + " encontra o rastro fresco de " + prey + ".",
  ]);
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

function sampleRounds<T>(rounds: readonly T[], amount: number): T[] {
  if (rounds.length <= amount) return [...rounds];

  const sampled: T[] = [];
  for (let i = 0; i < amount - 1; i++) {
    sampled.push(rounds[Math.floor((i * (rounds.length - 1)) / (amount - 1))]);
  }
  sampled.push(rounds[rounds.length - 1]);
  return sampled;
}

export function narrationOf(
  report: NarratedFight,
  maxBeats: number,
  hunter: string,
): NarrationLine[] {
  const prey = report.foe.name;
  const full = report.foe.health;
  const slots = Math.max(1, maxBeats - 2);
  const rounds = sampleRounds(report.combat.rounds, slots);

  const middle: NarrationLine[] = rounds.map((round) => ({
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
    { text: openerOf(hunter, prey), blow: null, critical: false, creatureHealth: full },
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
