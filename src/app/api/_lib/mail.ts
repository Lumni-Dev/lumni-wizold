import { createTransport } from "nodemailer";
import { SITE_EMAIL, SITE_URL, BRAND_LOGO_PNG_PATH } from "@/shared/constants/site";

const GAME_URL = SITE_URL;
const GAME_NAME = "WIZOLD";
const GAME_TAGLINE = "Chronicle of Lumni and Luna";

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
    '<!DOCTYPE html><html lang="en"><head>' +
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
    "The run lives on the Wizold server and waits for you in any browser.<br/>" +
    'Support: <a href="mailto:' +
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
    "The moon noticed you. Your account was just born in <strong style=\"color:" +
      INK +
      ';">Wizold</strong>, and the first night charges nothing to begin.',
    "Create your hunter, choose a one-word name and go down the ridge: training pays the body, the hunt pays the training, and the fury decides the rest.",
    "The run is kept on the server: close the browser whenever you want, the night waits.",
  ];
  await deliver(
    to,
    "The night was waiting for you",
    layout(paragraphs, "Enter the hunt"),
    "Your account was born in Wizold. Enter the hunt: " + GAME_URL,
  );
}

export async function sendPackInviteEmail(to: string, inviterName: string): Promise<void> {
  const tavern = GAME_URL + "/tavern";
  const paragraphs = [
    '<strong style="color:' +
      INK +
      ';">' +
      inviterName +
      "</strong> invited you to their pack in Wizold.",
    "The pack runs together: whoever is in your pack can open a reserved table with you, and you with them, the only way to talk one on one in the tavern.",
    "The invite waits in the Tavern, on the Invites board. That is where you accept or decline, with one click.",
  ];
  await deliver(
    to,
    inviterName + " invited you to the pack",
    layout(paragraphs, "Accept in the Tavern", tavern),
    inviterName + " invited you to the pack in Wizold. Accept in the Tavern: " + tavern,
  );
}

export async function sendFarewellEmail(to: string, characterName: string): Promise<void> {
  const paragraphs = [
    "The run of <strong style=\"color:" +
      INK +
      ';">' +
      characterName +
      "</strong> was ended, and the account was fully erased from the server: character, bag, wallet, tables and traces.",
    "If the moon calls again, the same door opens a new account, from the first howl onward.",
    "If the deletion was not you, write to support right away.",
  ];
  await deliver(
    to,
    "The run of " + characterName + " was ended",
    layout(paragraphs, "Start another hunt"),
    "The account of " + characterName + " was erased from Wizold. Return: " + GAME_URL,
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
    "An account departed from <strong style=\"color:" + INK + ';">Wizold</strong>.',
    "E-mail: <strong style=\"color:" +
      INK +
      ';">' +
      departedEmail +
      "</strong><br/>Character: <strong style=\"color:" +
      INK +
      ';">' +
      characterName +
      "</strong> (LV. " +
      characterLevel +
      ")<br/>When: " +
      saoPauloStamp(new Date()),
    "The record also lives in the account_departures table.",
  ];
  await deliver(
    admin,
    "An account departed: " + characterName,
    layout(paragraphs, "Open the game"),
    "Account deleted from Wizold: " + departedEmail + " (" + characterName + ").",
  );
}

function saoPauloStamp(when: Date): string {
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(when);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(when);
  return date + " at " + time;
}

export async function sendAccessEmail(to: string, when: Date): Promise<void> {
  const stamp = saoPauloStamp(when);
  const paragraphs = [
    'Your account entered Wizold at <strong style="color:' +
      INK +
      ';">' +
      stamp +
      "</strong>, São Paulo time.",
    "If it was you, good hunting: the night is open.",
    "If you do not recognize this access, write to support right away and the door will be locked.",
  ];
  await deliver(
    to,
    "New access to your account",
    layout(paragraphs, "Open the game"),
    "New access to your account in Wizold: " + stamp + " (São Paulo time). " + GAME_URL,
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
      ? "Someone just knocked on the door with your Google account. To enter, confirm with this code:"
      : reason === "enable"
        ? "You asked to turn on two-step verification in Wizold. Confirm with this code:"
        : reason === "disable"
          ? "You asked to turn off two-step verification in Wizold. Confirm with this code:"
          : "You asked to delete your account in Wizold. This is the confirmation code:";

  const tail =
    reason === "login"
      ? "If it was not you, ignore this letter and change your Google account password."
      : reason === "delete"
        ? "Once confirmed, the account and everything it keeps vanish from the server for good."
        : "Without the code, nothing changes.";

  const subject =
    reason === "login"
      ? "Code to enter: " + code
      : reason === "enable"
        ? "Code to turn verification on: " + code
        : reason === "disable"
          ? "Code to turn verification off: " + code
          : "Code to delete the account: " + code;

  const paragraphs = [intro, codeBlock, "It is good for 10 minutes.", tail];
  if (reason === "delete") {
    paragraphs.push("If it was not you, ignore this letter: without the code, nothing happens.");
  }

  await deliver(
    to,
    subject,
    layout(paragraphs, reason === "login" ? "Enter the hunt" : "Back to the game"),
    "Wizold code: " + code + " (good for 10 minutes).",
  );
}
