import { EN } from "./en";
import { ES } from "./es";
import type { Locale } from "./locale";

const MAPS: Record<Exclude<Locale, "pt">, Record<string, string>> = { en: EN, es: ES };

interface PatternRule {
  pattern: RegExp;
  en: string;
  es: string;
}

// Interpolated strings cannot match by exact key, so the common shapes are
// translated by pattern, keeping the numbers where they are.
const RULES: readonly PatternRule[] = [
  {
    pattern: /^Experiência \(NV\. (.+)\)$/,
    en: "Experience (LV. $1)",
    es: "Experiencia (NV. $1)",
  },
  {
    pattern: /^Mascote - Experiência \(NV\. (.+)\)$/,
    en: "Companion - Experience (LV. $1)",
    es: "Compañero - Experiencia (NV. $1)",
  },
  { pattern: /^Parar \((\d+)\)$/, en: "Stop ($1)", es: "Parar ($1)" },
  { pattern: /^Parar em (\d+)s$/, en: "Stop in $1s", es: "Parar en $1s" },
  { pattern: /^(\d+) \/ (\d+) pessoa(s?)$/, en: "$1 / $2 people", es: "$1 / $2 personas" },
  { pattern: /^Forjar custa (.+)$/, en: "Forging costs $1", es: "Forjar cuesta $1" },
  {
    pattern: /^Reseta às (\d{2}:\d{2}), faltam (.+)$/,
    en: "Resets at $1, $2 left",
    es: "Reinicia a las $1, faltan $2",
  },
  { pattern: /^Continuar com (.+)$/, en: "Continue as $1", es: "Continuar con $1" },
  { pattern: /^(\d[\d.,]*) itens$/, en: "$1 items", es: "$1 objetos" },
  {
    pattern: /^Mesas de conversa para até (\d+) pessoas, com ou sem senha\. A mesa fecha sozinha quando a última pessoa sai\.$/,
    en: "Chat tables for up to $1 people, with or without a password. A table closes itself when the last person leaves.",
    es: "Mesas de charla para hasta $1 personas, con o sin contraseña. La mesa se cierra sola cuando sale la última persona.",
  },
  {
    pattern: /^Recursos esgotados, voltam em (.+)$/,
    en: "Resources spent, back in $1",
    es: "Recursos agotados, vuelven en $1",
  },
  {
    pattern: /^\+(.+) a (.+) fragmentos por mineração$/,
    en: "+$1 to $2 fragments per mining",
    es: "+$1 a $2 fragmentos por minado",
  },
  {
    pattern: /^Treino gratuito para sempre: um exercício por atributo, cada barra cheia vira \+1 permanente\. Cada sessão sorteia de (\d+) a (\d+) passos, então uma sai rápida e a seguinte cobra paciência\. Não dá para parar no meio de uma sessão, mas entre uma e outra sobram três segundos para você mandar parar\.$/,
    en: "Training is free forever: one exercise per attribute, every full bar becomes a permanent +1. Each session draws $1 to $2 steps, so one goes fast and the next asks for patience. You cannot stop mid-session, but between one and the next there are three seconds to call it off.",
    es: "Entrenamiento gratis para siempre: un ejercicio por atributo, cada barra llena se vuelve +1 permanente. Cada sesión sortea de $1 a $2 pasos, así que una sale rápida y la siguiente pide paciencia. No se puede parar a mitad de una sesión, pero entre una y otra quedan tres segundos para mandarla parar.",
  },
  {
    pattern: /^O treino repete sozinho até você mandar parar, e o teto de cada atributo é (.+)\.$/,
    en: "Training repeats on its own until you say stop, and each attribute caps at $1.",
    es: "El entrenamiento se repite solo hasta que mandes parar, y el techo de cada atributo es $1.",
  },
  {
    pattern: /^Cada clique treina uma sessão, e o teto de cada atributo é (.+)\.$/,
    en: "Each click trains one session, and each attribute caps at $1.",
    es: "Cada clic entrena una sesión, y el techo de cada atributo es $1.",
  },
  { pattern: /^Ouvir sobre (.+)$/, en: "Hear about $1", es: "Escuchar sobre $1" },
  { pattern: /^Aceitar (.+)$/, en: "Accept $1", es: "Aceptar $1" },
  { pattern: /^Recusar (.+)$/, en: "Decline $1", es: "Rechazar $1" },
  { pattern: /^Falar com (.+)$/, en: "Talk to $1", es: "Hablar con $1" },
  { pattern: /^Sair da matilha com (.+)$/, en: "Leave the pack with $1", es: "Salir de la manada con $1" },
  { pattern: /^Quantidade de (.+)$/, en: "Quantity of $1", es: "Cantidad de $1" },
  { pattern: /^Você tem (.+)$/, en: "You have $1", es: "Tienes $1" },
  { pattern: /^Você consegue pagar por (.+)$/, en: "You can pay for $1", es: "Puedes pagar $1" },
  { pattern: /^O mínimo é (.+)$/, en: "The minimum is $1", es: "El mínimo es $1" },
  { pattern: /^Disponíveis: (.+)$/, en: "Available: $1", es: "Disponibles: $1" },
  { pattern: /^Ativo até (.+)$/, en: "Active until $1", es: "Activo hasta $1" },
  { pattern: /^Melhor em (.+)$/, en: "Best at $1", es: "Mejor en $1" },
  { pattern: /^Senha da mesa (.+)$/, en: "Password of table $1", es: "Contraseña de la mesa $1" },
  {
    pattern: /^A arena só marca luta entre NV\. (.+) e NV\. (.+): (.+) caçadores nessa faixa\. Não se ganha experiência aqui: quem vence tira da bolsa do perdedor de (.+) a (.+) WCoins, sorteadas, e nunca mais que um quarto do que ele carrega\. Quem perde paga pela mesma régua\. Quem já duelou com você descansa até as 06:00 antes de subir de novo\.$/,
    en: "The arena only books fights between LV. $1 and LV. $2: $3 hunters in that band. No experience is earned here: the winner draws $4 to $5 WCoins from the loser's purse, never more than a quarter of what they carry. The loser pays by the same rule. Whoever already dueled you rests until 06:00 before climbing again.",
    es: "La arena solo marca peleas entre NV. $1 y NV. $2: $3 cazadores en esa franja. Aquí no se gana experiencia: quien vence saca de la bolsa del perdedor de $4 a $5 WCoins, sorteadas, y nunca más de un cuarto de lo que lleva. Quien pierde paga con la misma regla. Quien ya se batió contigo descansa hasta las 06:00 antes de volver a subir.",
  },
  {
    pattern: /^Você contra (.+)\. Em jogo, um pedaço da bolsa de quem cair: de (.+) a (.+)\.$/,
    en: "You against $1. At stake, a piece of the fallen one's purse: $2 to $3.",
    es: "Tú contra $1. En juego, un pedazo de la bolsa de quien caiga: de $2 a $3.",
  },
  {
    pattern: /^Fora da sua faixa: a arena só marca luta entre NV\. (.+) e NV\. (.+)\.$/,
    en: "Out of your band: the arena only books fights between LV. $1 and LV. $2.",
    es: "Fuera de tu franja: la arena solo marca peleas entre NV. $1 y NV. $2.",
  },
  {
    pattern: /^Vocês já duelaram hoje: o próximo desafio a ele reabre às 06:00\. Faltam (.+)\.$/,
    en: "You two already dueled today: the next challenge to them reopens at 06:00. $1 left.",
    es: "Ustedes ya se batieron hoy: el próximo desafío se reabre a las 06:00. Faltan $1.",
  },
  { pattern: /^Vitória sobre (.+)$/, en: "Victory over $1", es: "Victoria sobre $1" },
  { pattern: /^Derrota para (.+)$/, en: "Defeat to $1", es: "Derrota ante $1" },
  { pattern: /^Empate com (.+)$/, en: "Draw with $1", es: "Empate con $1" },
  { pattern: /^Ataque seu - (.+)$/, en: "Your attack - $1", es: "Ataque tuyo - $1" },
  { pattern: /^Ataque recebido - (.+)$/, en: "Attack received - $1", es: "Ataque recibido - $1" },
  { pattern: /^Volta em (.+)$/, en: "Back in $1", es: "Vuelve en $1" },
  { pattern: /^(\d[\d.,]*) de (\d+) ataques$/, en: "$1 of $2 attacks", es: "$1 de $2 ataques" },
  {
    pattern: /^(.+) ficou no chão, e a bolsa é sua\.$/,
    en: "$1 stayed on the ground, and the purse is yours.",
    es: "$1 quedó en el suelo, y la bolsa es tuya.",
  },
  {
    pattern: /^(.+) levou a melhor\. Você sai por baixo, mas sai\.$/,
    en: "$1 got the better of it. You leave beaten, but you leave.",
    es: "$1 se llevó la mejor parte. Sales por abajo, pero sales.",
  },
];

export function translate(text: string, locale: Locale): string {
  if (locale === "pt") return text;
  const direct = MAPS[locale][text];
  if (direct !== undefined) return direct;
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return text.replace(rule.pattern, rule[locale]);
  }
  return text;
}
