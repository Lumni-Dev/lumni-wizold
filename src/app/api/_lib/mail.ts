import { createTransport } from "nodemailer";
import { SITE_EMAIL, SITE_URL, BRAND_LOGO_PNG_PATH } from "@/shared/constants/site";
import type { Locale } from "@/shared/i18n/locale";

const GAME_URL = SITE_URL;
const GAME_NAME = "WIZOLD";

// English is the source; the pt and es packs below keep each letter speaking
// the language stored on users.locale. The admin letters stay English.
const TAGLINE: Record<Locale, string> = {
  en: "Chronicle of Lumni and Luna",
  pt: "Crônica de Lumni e Luna",
  es: "Crónica de Lumni y Luna",
};

const FOOTER_LINE: Record<Locale, string> = {
  en: "The run lives on the Wizold server and waits for you in any browser.",
  pt: "A partida vive no servidor de Wizold e te espera em qualquer navegador.",
  es: "La partida vive en el servidor de Wizold y te espera en cualquier navegador.",
};

const SUPPORT_LABEL: Record<Locale, string> = {
  en: "Support",
  pt: "Suporte",
  es: "Soporte",
};

const BASE = "#070503";
const SURFACE = "#130d09";
const SURFACE_TOP = "#231a14";
const EDGE = "#2e2118";
const INK = "#f0e9e2";
const INK_SOFT = "#ac9c8d";
const INK_FAINT = "#79695a";
const EMBER = "#e08d35";
const LOGO_URL = GAME_URL + BRAND_LOGO_PNG_PATH;

function transporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new Error("SMTP missing from the environment.");
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
  locale: Locale,
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
    '<!DOCTYPE html><html lang="' +
    locale +
    '"><head>' +
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
    TAGLINE[locale] +
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
    FOOTER_LINE[locale] +
    "<br/>" +
    SUPPORT_LABEL[locale] +
    ': <a href="mailto:' +
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

function strong(text: string): string {
  return '<strong style="color:' + INK + ';">' + text + "</strong>";
}

export async function sendWelcomeEmail(to: string, locale: Locale = "en"): Promise<void> {
  const COPY: Record<Locale, { subject: string; button: string; paragraphs: string[]; text: string }> = {
    en: {
      subject: "The night was waiting for you",
      button: "Enter the hunt",
      paragraphs: [
        "The moon noticed you. Your account was just born in " +
          strong("Wizold") +
          ", and the first night charges nothing to begin.",
        "Create your hunter, choose a one-word name and go down the ridge: training pays the body, the hunt pays the training, and the fury decides the rest.",
        "The run is kept on the server: close the browser whenever you want, the night waits.",
      ],
      text: "Your account was born in Wizold. Enter the hunt: " + GAME_URL,
    },
    pt: {
      subject: "A noite te esperava",
      button: "Entrar na caçada",
      paragraphs: [
        "A lua reparou em você. A sua conta acaba de nascer em " +
          strong("Wizold") +
          ", e a primeira noite não cobra nada para começar.",
        "Crie o seu caçador, escolha um nome de uma palavra só e desça a serra: o treino paga o corpo, a caçada paga o treino, e a fúria decide o resto.",
        "A partida fica guardada no servidor: feche o navegador quando quiser, a noite espera.",
      ],
      text: "Sua conta nasceu em Wizold. Entre na caçada: " + GAME_URL,
    },
    es: {
      subject: "La noche te esperaba",
      button: "Entrar a la cacería",
      paragraphs: [
        "La luna se fijó en ti. Tu cuenta acaba de nacer en " +
          strong("Wizold") +
          ", y la primera noche no cobra nada para empezar.",
        "Crea tu cazador, elige un nombre de una sola palabra y baja la sierra: el entrenamiento paga el cuerpo, la cacería paga el entrenamiento, y la furia decide el resto.",
        "La partida queda guardada en el servidor: cierra el navegador cuando quieras, la noche espera.",
      ],
      text: "Tu cuenta nació en Wizold. Entra a la cacería: " + GAME_URL,
    },
  };
  const copy = COPY[locale];
  await deliver(to, copy.subject, layout(copy.paragraphs, copy.button, locale), copy.text);
}

export async function sendPackInviteEmail(
  to: string,
  inviterName: string,
  locale: Locale = "en",
): Promise<void> {
  const tavern = GAME_URL + "/tavern";
  const COPY: Record<Locale, { subject: string; button: string; paragraphs: string[]; text: string }> = {
    en: {
      subject: inviterName + " invited you to the pack",
      button: "Accept in the Tavern",
      paragraphs: [
        strong(inviterName) + " invited you to their pack in Wizold.",
        "The pack runs together: whoever is in your pack can open a reserved table with you, and you with them, the only way to talk one on one in the tavern.",
        "The invite waits in the Tavern, on the Invites board. That is where you accept or decline, with one click.",
      ],
      text: inviterName + " invited you to the pack in Wizold. Accept in the Tavern: " + tavern,
    },
    pt: {
      subject: inviterName + " chamou você para a matilha",
      button: "Aceitar na Taverna",
      paragraphs: [
        strong(inviterName) + " chamou você para a matilha dele em Wizold.",
        "A matilha corre junta: quem é da sua matilha pode abrir uma mesa reservada com você, e você com ele, o único jeito de conversar a dois na taverna.",
        "O convite espera na Taverna, no quadro de Convites. É lá que você aceita ou recusa, com um clique.",
      ],
      text: inviterName + " chamou você para a matilha em Wizold. Aceite na Taverna: " + tavern,
    },
    es: {
      subject: inviterName + " te invitó a la manada",
      button: "Aceptar en la Taberna",
      paragraphs: [
        strong(inviterName) + " te invitó a su manada en Wizold.",
        "La manada corre junta: quien está en tu manada puede abrir una mesa reservada contigo, y tú con él, la única forma de hablar a solas en la taberna.",
        "La invitación espera en la Taberna, en el tablero de Invitaciones. Ahí aceptas o rechazas, con un clic.",
      ],
      text: inviterName + " te invitó a la manada en Wizold. Acepta en la Taberna: " + tavern,
    },
  };
  const copy = COPY[locale];
  await deliver(to, copy.subject, layout(copy.paragraphs, copy.button, locale, tavern), copy.text);
}

export async function sendFarewellEmail(
  to: string,
  characterName: string,
  locale: Locale = "en",
): Promise<void> {
  const COPY: Record<Locale, { subject: string; button: string; paragraphs: string[]; text: string }> = {
    en: {
      subject: "The run of " + characterName + " was ended",
      button: "Start another hunt",
      paragraphs: [
        "The run of " +
          strong(characterName) +
          " was ended, and the account was fully erased from the server: character, bag, wallet, tables and traces.",
        "If the moon calls again, the same door opens a new account, from the first howl onward.",
        "If the deletion was not you, write to support right away.",
      ],
      text: "The account of " + characterName + " was erased from Wizold. Return: " + GAME_URL,
    },
    pt: {
      subject: "A partida de " + characterName + " foi encerrada",
      button: "Começar outra caçada",
      paragraphs: [
        "A partida de " +
          strong(characterName) +
          " foi encerrada, e a conta foi apagada por inteiro do servidor: personagem, mochila, carteira, mesas e rastros.",
        "Se a lua chamar de novo, a mesma porta abre uma conta nova, do primeiro uivo em diante.",
        "Se a exclusão não foi você, escreva agora para o suporte.",
      ],
      text: "A conta de " + characterName + " foi apagada de Wizold. Voltar: " + GAME_URL,
    },
    es: {
      subject: "La partida de " + characterName + " fue cerrada",
      button: "Empezar otra cacería",
      paragraphs: [
        "La partida de " +
          strong(characterName) +
          " fue cerrada, y la cuenta fue borrada por completo del servidor: personaje, mochila, cartera, mesas y rastros.",
        "Si la luna llama de nuevo, la misma puerta abre una cuenta nueva, del primer aullido en adelante.",
        "Si la eliminación no fuiste tú, escribe ahora a soporte.",
      ],
      text: "La cuenta de " + characterName + " fue borrada de Wizold. Volver: " + GAME_URL,
    },
  };
  const copy = COPY[locale];
  await deliver(to, copy.subject, layout(copy.paragraphs, copy.button, locale), copy.text);
}

export async function sendDepartureNoticeEmail(
  departedEmail: string,
  characterName: string,
  characterLevel: number,
): Promise<void> {
  const admin = process.env.SMTP_SENDER ?? process.env.SMTP_USER;
  if (!admin) return;
  const paragraphs = [
    "An account departed from " + strong("Wizold") + ".",
    "E-mail: " +
      strong(departedEmail) +
      "<br/>Character: " +
      strong(characterName) +
      " (LV. " +
      characterLevel +
      ")<br/>When: " +
      saoPauloStamp(new Date(), "en"),
    "The record also lives in the account_departures table.",
  ];
  await deliver(
    admin,
    "An account departed: " + characterName,
    layout(paragraphs, "Open the game", "en"),
    "Account deleted from Wizold: " + departedEmail + " (" + characterName + ").",
  );
}

const STAMP_FORMAT: Record<Locale, { tag: string; joiner: string }> = {
  en: { tag: "en-GB", joiner: " at " },
  pt: { tag: "pt-BR", joiner: " às " },
  es: { tag: "es-ES", joiner: " a las " },
};

function saoPauloStamp(when: Date, locale: Locale): string {
  const format = STAMP_FORMAT[locale];
  const date = new Intl.DateTimeFormat(format.tag, {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(when);
  const time = new Intl.DateTimeFormat(format.tag, {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(when);
  return date + format.joiner + time;
}

export async function sendAccessEmail(
  to: string,
  when: Date,
  locale: Locale = "en",
): Promise<void> {
  const stamp = saoPauloStamp(when, locale);
  const COPY: Record<Locale, { subject: string; button: string; paragraphs: string[]; text: string }> = {
    en: {
      subject: "New access to your account",
      button: "Open the game",
      paragraphs: [
        "Your account entered Wizold at " + strong(stamp) + ", São Paulo time.",
        "If it was you, good hunting: the night is open.",
        "If you do not recognize this access, write to support right away and the door will be locked.",
      ],
      text: "New access to your account in Wizold: " + stamp + " (São Paulo time). " + GAME_URL,
    },
    pt: {
      subject: "Novo acesso à sua conta",
      button: "Abrir o jogo",
      paragraphs: [
        "Sua conta entrou em Wizold em " + strong(stamp) + ", horário de São Paulo.",
        "Se foi você, boa caçada: a noite está aberta.",
        "Se você não reconhece este acesso, escreva agora para o suporte e a porta será trancada.",
      ],
      text: "Novo acesso à sua conta em Wizold: " + stamp + " (horário de São Paulo). " + GAME_URL,
    },
    es: {
      subject: "Nuevo acceso a tu cuenta",
      button: "Abrir el juego",
      paragraphs: [
        "Tu cuenta entró a Wizold el " + strong(stamp) + ", hora de São Paulo.",
        "Si fuiste tú, buena caza: la noche está abierta.",
        "Si no reconoces este acceso, escribe ahora a soporte y la puerta será cerrada.",
      ],
      text: "Nuevo acceso a tu cuenta en Wizold: " + stamp + " (hora de São Paulo). " + GAME_URL,
    },
  };
  const copy = COPY[locale];
  await deliver(to, copy.subject, layout(copy.paragraphs, copy.button, locale), copy.text);
}

export async function sendDeletionCodeEmail(
  to: string,
  code: string,
  locale: Locale = "en",
): Promise<void> {
  await sendTwoFactorCodeEmail(to, code, "delete", locale);
}

type TwoFactorReason = "login" | "enable" | "disable" | "delete";

const TWO_FACTOR_COPY: Record<
  Locale,
  {
    intro: Record<TwoFactorReason, string>;
    tail: Record<TwoFactorReason, string>;
    subject: Record<TwoFactorReason, string>;
    validity: string;
    deleteNote: string;
    buttonLogin: string;
    buttonOther: string;
    text: (code: string) => string;
  }
> = {
  en: {
    intro: {
      login: "Someone just knocked on the door with your Google account. To enter, confirm with this code:",
      enable: "You asked to turn on two-step verification in Wizold. Confirm with this code:",
      disable: "You asked to turn off two-step verification in Wizold. Confirm with this code:",
      delete: "You asked to delete your account in Wizold. This is the confirmation code:",
    },
    tail: {
      login: "If it was not you, ignore this letter and change your Google account password.",
      enable: "Without the code, nothing changes.",
      disable: "Without the code, nothing changes.",
      delete: "Once confirmed, the account and everything it keeps vanish from the server for good.",
    },
    subject: {
      login: "Code to enter: ",
      enable: "Code to turn verification on: ",
      disable: "Code to turn verification off: ",
      delete: "Code to delete the account: ",
    },
    validity: "It is good for 10 minutes.",
    deleteNote: "If it was not you, ignore this letter: without the code, nothing happens.",
    buttonLogin: "Enter the hunt",
    buttonOther: "Back to the game",
    text: (code) => "Wizold code: " + code + " (good for 10 minutes).",
  },
  pt: {
    intro: {
      login: "Alguém acabou de bater na porta com a sua conta Google. Para entrar, confirme com este código:",
      enable: "Você pediu para ligar a verificação em duas etapas em Wizold. Confirme com este código:",
      disable: "Você pediu para desligar a verificação em duas etapas em Wizold. Confirme com este código:",
      delete: "Você pediu para excluir a sua conta em Wizold. Este é o código de confirmação:",
    },
    tail: {
      login: "Se não foi você, ignore esta carta e troque a senha da conta Google.",
      enable: "Sem o código, nada muda.",
      disable: "Sem o código, nada muda.",
      delete: "Confirmando, a conta e tudo o que ela guarda somem do servidor para sempre.",
    },
    subject: {
      login: "Código para entrar: ",
      enable: "Código para ligar a verificação: ",
      disable: "Código para desligar a verificação: ",
      delete: "Código para excluir a conta: ",
    },
    validity: "Ele vale por 10 minutos.",
    deleteNote: "Se não foi você, ignore esta carta: sem o código, nada acontece.",
    buttonLogin: "Entrar na caçada",
    buttonOther: "Voltar ao jogo",
    text: (code) => "Código Wizold: " + code + " (vale 10 minutos).",
  },
  es: {
    intro: {
      login: "Alguien acaba de llamar a la puerta con tu cuenta de Google. Para entrar, confirma con este código:",
      enable: "Pediste activar la verificación en dos pasos en Wizold. Confirma con este código:",
      disable: "Pediste desactivar la verificación en dos pasos en Wizold. Confirma con este código:",
      delete: "Pediste borrar tu cuenta en Wizold. Este es el código de confirmación:",
    },
    tail: {
      login: "Si no fuiste tú, ignora esta carta y cambia la contraseña de tu cuenta de Google.",
      enable: "Sin el código, nada cambia.",
      disable: "Sin el código, nada cambia.",
      delete: "Al confirmar, la cuenta y todo lo que guarda desaparecen del servidor para siempre.",
    },
    subject: {
      login: "Código para entrar: ",
      enable: "Código para activar la verificación: ",
      disable: "Código para desactivar la verificación: ",
      delete: "Código para borrar la cuenta: ",
    },
    validity: "Vale por 10 minutos.",
    deleteNote: "Si no fuiste tú, ignora esta carta: sin el código, nada pasa.",
    buttonLogin: "Entrar a la cacería",
    buttonOther: "Volver al juego",
    text: (code) => "Código Wizold: " + code + " (vale 10 minutos).",
  },
};

export async function sendTwoFactorCodeEmail(
  to: string,
  code: string,
  reason: TwoFactorReason,
  locale: Locale = "en",
): Promise<void> {
  const copy = TWO_FACTOR_COPY[locale];
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

  const paragraphs = [copy.intro[reason], codeBlock, copy.validity, copy.tail[reason]];
  if (reason === "delete") paragraphs.push(copy.deleteNote);

  await deliver(
    to,
    copy.subject[reason] + code,
    layout(paragraphs, reason === "login" ? copy.buttonLogin : copy.buttonOther, locale),
    copy.text(code),
  );
}
