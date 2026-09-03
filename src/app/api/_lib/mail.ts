import { createTransport } from "nodemailer";
import { SITE_EMAIL } from "@/shared/constants/site";

const GAME_URL = "https://wizold.lumni.dev.br";
const GAME_NAME = "WIZOLD";
const GAME_TAGLINE = "Crônica de Lumni e Luna";

const BASE = "#070503";
const SURFACE = "#130d09";
const SURFACE_TOP = "#231a14";
const EDGE = "#2e2118";
const INK = "#f0e9e2";
const INK_SOFT = "#ac9c8d";
const INK_FAINT = "#79695a";
const EMBER = "#f2761b";
const LOGO_URL = GAME_URL + "/assets/ui/logo.png?v=3";

function transporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new Error("SMTP ausente no ambiente.");
  return createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function layout(
  paragraphs: readonly string[],
  buttonLabel: string,
  buttonHref: string = GAME_URL,
): string {
  const body = paragraphs
    .map(
      (text) =>
        '<p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:' +
        INK_SOFT +
        ';">' +
        text +
        "</p>",
    )
    .join("");
  return (
    '<!DOCTYPE html><html lang="pt-BR"><head>' +
    '<meta charset="utf-8" />' +
    '<meta name="viewport" content="width=device-width,initial-scale=1" />' +
    '<meta name="color-scheme" content="dark" />' +
    '<meta name="supported-color-schemes" content="dark" />' +
    "</head>" +
    '<body style="margin:0;padding:0;width:100%;background-color:' +
    BASE +
    ';">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' +
    BASE +
    '" style="background-color:' +
    BASE +
    ';width:100%;"><tr><td align="center" bgcolor="' +
    BASE +
    '" style="background-color:' +
    BASE +
    ';">' +
    '<div style="margin:0;padding:32px 16px;background-color:' +
    BASE +
    ';font-family:Arial,Helvetica,sans-serif;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">' +
    "<tr><td>" +
    '<div style="text-align:center;padding:24px 0;">' +
    '<img src="' +
    LOGO_URL +
    '" alt="' +
    GAME_NAME +
    '" width="220" style="display:block;margin:0 auto;max-width:220px;height:auto;border:0;" />' +
    '<div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:' +
    INK_FAINT +
    ';margin-top:10px;">' +
    GAME_TAGLINE +
    "</div>" +
    "</div>" +
    '<div style="background-color:' +
    SURFACE +
    ";border:1px solid " +
    EDGE +
    ';border-radius:8px;padding:28px;">' +
    body +
    '<div style="text-align:center;padding-top:10px;">' +
    '<a href="' +
    buttonHref +
    '" style="display:inline-block;background-color:' +
    EMBER +
    ";color:" +
    BASE +
    ';text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:14px 28px;border-radius:6px;">' +
    buttonLabel +
    "</a>" +
    "</div>" +
    "</div>" +
    '<div style="text-align:center;padding:20px 0;font-size:11px;line-height:1.7;color:' +
    INK_FAINT +
    ';">' +
    "A partida vive no servidor de Wizold e te espera em qualquer navegador.<br/>" +
    'Suporte: <a href="mailto:' +
    SITE_EMAIL +
    '" style="color:' +
    INK_SOFT +
    ';text-decoration:none;">' +
    SITE_EMAIL +
    "</a>" +
    "</div>" +
    "</td></tr></table></div>" +
    "</td></tr></table></body></html>"
  );
}

async function deliver(to: string, subject: string, html: string, text: string): Promise<void> {
  await transporter().sendMail({
    from: GAME_NAME.charAt(0) + GAME_NAME.slice(1).toLowerCase() + " <" + (process.env.SMTP_SENDER ?? process.env.SMTP_USER) + ">",
    to,
    subject,
    html,
    text,
  });
}

export async function sendWelcomeEmail(to: string): Promise<void> {
  const paragraphs = [
    "A lua reparou em você. A sua conta acaba de nascer em <strong style=\"color:" +
      INK +
      ';">Wizold</strong>, e a primeira noite não cobra nada para começar.',
    "Crie o seu caçador, escolha um nome de uma palavra só e desça a serra: o treino paga o corpo, a caçada paga o treino, e a fúria decide o resto.",
    "A partida fica guardada no servidor: feche o navegador quando quiser, a noite espera.",
  ];
  await deliver(
    to,
    "A noite te esperava",
    layout(paragraphs, "Entrar na caçada"),
    "Sua conta nasceu em Wizold. Entre na caçada: " + GAME_URL,
  );
}

export async function sendPackInviteEmail(to: string, inviterName: string): Promise<void> {
  const tavern = GAME_URL + "/tavern";
  const paragraphs = [
    '<strong style="color:' +
      INK +
      ';">' +
      inviterName +
      "</strong> chamou você para a matilha dele em Wizold.",
    "A matilha corre junta: quem é da sua matilha pode abrir uma mesa reservada com você, e você com ele, o único jeito de conversar a dois na taverna.",
    "O convite espera na Taverna, no quadro de Convites. É lá que você aceita ou recusa, com um clique.",
  ];
  await deliver(
    to,
    inviterName + " chamou você para a matilha",
    layout(paragraphs, "Aceitar na Taverna", tavern),
    inviterName + " chamou você para a matilha em Wizold. Aceite na Taverna: " + tavern,
  );
}

export async function sendFarewellEmail(to: string, characterName: string): Promise<void> {
  const paragraphs = [
    "A partida de <strong style=\"color:" +
      INK +
      ';">' +
      characterName +
      "</strong> foi encerrada, e a conta foi apagada por inteiro do servidor: personagem, mochila, carteira, mesas e rastros.",
    "Se a lua chamar de novo, a mesma porta abre uma conta nova, do primeiro uivo em diante.",
    "Se a exclusão não foi você, escreva agora para o suporte.",
  ];
  await deliver(
    to,
    "A partida de " + characterName + " foi encerrada",
    layout(paragraphs, "Começar outra caçada"),
    "A conta de " + characterName + " foi apagada de Wizold. Voltar: " + GAME_URL,
  );
}

export async function sendDepartureNoticeEmail(
  departedEmail: string,
  characterName: string,
  characterLevel: number,
): Promise<void> {
  const admin = process.env.SMTP_SENDER ?? process.env.SMTP_USER;
  if (!admin) return;
  const paragraphs = [
    "Uma conta partiu de <strong style=\"color:" + INK + ';">Wizold</strong>.',
    "E-mail: <strong style=\"color:" +
      INK +
      ';">' +
      departedEmail +
      "</strong><br/>Personagem: <strong style=\"color:" +
      INK +
      ';">' +
      characterName +
      "</strong> (NV. " +
      characterLevel +
      ")<br/>Quando: " +
      saoPauloStamp(new Date()),
    "O registro também fica na tabela account_departures.",
  ];
  await deliver(
    admin,
    "Uma conta partiu: " + characterName,
    layout(paragraphs, "Abrir o jogo"),
    "Conta excluída de Wizold: " + departedEmail + " (" + characterName + ").",
  );
}

function saoPauloStamp(when: Date): string {
  const date = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(when);
  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(when);
  return date + " às " + time;
}

export async function sendAccessEmail(to: string, when: Date): Promise<void> {
  const stamp = saoPauloStamp(when);
  const paragraphs = [
    'Sua conta entrou em Wizold em <strong style="color:' +
      INK +
      ';">' +
      stamp +
      "</strong>, horário de São Paulo.",
    "Se foi você, boa caçada: a noite está aberta.",
    "Se você não reconhece este acesso, escreva agora para o suporte e a porta será trancada.",
  ];
  await deliver(
    to,
    "Novo acesso à sua conta",
    layout(paragraphs, "Abrir o jogo"),
    "Novo acesso à sua conta em Wizold: " + stamp + " (horário de São Paulo). " + GAME_URL,
  );
}

export async function sendDeletionCodeEmail(to: string, code: string): Promise<void> {
  await sendTwoFactorCodeEmail(to, code, "delete");
}

export async function sendTwoFactorCodeEmail(
  to: string,
  code: string,
  reason: "login" | "enable" | "disable" | "delete",
): Promise<void> {
  const codeBlock =
    '<div style="text-align:center;margin:6px 0 20px;">' +
    '<span style="display:inline-block;background-color:' +
    SURFACE_TOP +
    ";border:1px solid " +
    EDGE +
    ";color:" +
    INK +
    ';font-size:28px;letter-spacing:8px;padding:14px 16px;border-radius:6px;font-family:Consolas,Menlo,monospace;">' +
    code +
    "</span></div>";

  const intro =
    reason === "login"
      ? "Alguém acabou de bater na porta com a sua conta Google. Para entrar, confirme com este código:"
      : reason === "enable"
        ? "Você pediu para ligar a verificação em duas etapas em Wizold. Confirme com este código:"
        : reason === "disable"
          ? "Você pediu para desligar a verificação em duas etapas em Wizold. Confirme com este código:"
          : "Você pediu para excluir a sua conta em Wizold. Este é o código de confirmação:";

  const tail =
    reason === "login"
      ? "Se não foi você, ignore esta carta e troque a senha da conta Google."
      : reason === "delete"
        ? "Confirmando, a conta e tudo o que ela guarda somem do servidor para sempre."
        : "Sem o código, nada muda.";

  const subject =
    reason === "login"
      ? "Código para entrar: " + code
      : reason === "enable"
        ? "Código para ligar a verificação: " + code
        : reason === "disable"
          ? "Código para desligar a verificação: " + code
          : "Código para excluir a conta: " + code;

  const paragraphs = [intro, codeBlock, "Ele vale por 10 minutos.", tail];
  if (reason === "delete") {
    paragraphs.push("Se não foi você, ignore esta carta: sem o código, nada acontece.");
  }

  await deliver(
    to,
    subject,
    layout(paragraphs, reason === "login" ? "Entrar na caçada" : "Voltar ao jogo"),
    "Código Wizold: " + code + " (vale 10 minutos).",
  );
}
