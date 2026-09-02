"use client";

import { tavernPushRepository } from "@/models/repositories/tavern-push.repository";
import { formatDay } from "@/shared/utils/format";
import { api } from "./api.client";

const SW_URL = "/sw.js";
const ICON = "/assets/ui/caneca.png";

interface NotificationOptionsWithActions extends NotificationOptions {
  actions?: { action: string; title: string }[];
}

export function vapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
}

export function webPushConfigured(): boolean {
  return vapidPublicKey().length > 0;
}

export function tavernPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function tavernPushActive(): boolean {
  return (
    tavernPushSupported() && tavernPushRepository.enabled() && Notification.permission === "granted"
  );
}

function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) output[index] = raw.charCodeAt(index);
  return output;
}

function registerWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return Promise.resolve(null);
  return navigator.serviceWorker.register(SW_URL).catch(() => null);
}

export function ensureTavernWorker(): void {
  if (tavernPushActive()) void registerWorker();
}

async function subscribeOnServer(subscription: PushSubscription): Promise<boolean> {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return false;
  const answer = await api("POST", "/api/tavern/push/subscribe", {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  });
  return answer.ok;
}

async function unsubscribeOnServer(endpoint: string): Promise<void> {
  await api("DELETE", "/api/tavern/push/unsubscribe", { endpoint });
}

export async function enableTavernPush(): Promise<NotificationPermission> {
  if (!tavernPushSupported()) {
    tavernPushRepository.setEnabled(false);
    return "denied";
  }

  let permission = Notification.permission;
  if (permission === "default") permission = await Notification.requestPermission();
  if (permission !== "granted") {
    tavernPushRepository.setEnabled(false);
    return permission;
  }

  tavernPushRepository.setEnabled(true);

  if (!webPushConfigured()) return permission;

  const registration = await registerWorker();
  if (!registration) return permission;

  try {
    const key = urlBase64ToUint8Array(vapidPublicKey()) as BufferSource;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });
    }
    const saved = await subscribeOnServer(subscription);
    if (!saved) {
      try {
        await subscription.unsubscribe();
      } catch {}
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });
      await subscribeOnServer(subscription);
    }
  } catch {
    // O switch fica ligado: avisos locais e no painel seguem valendo.
  }

  return permission;
}

export async function disableTavernPush(): Promise<void> {
  tavernPushRepository.setEnabled(false);
  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;
    const endpoint = subscription.endpoint;
    await unsubscribeOnServer(endpoint);
    await subscription.unsubscribe();
  } catch {
    // O switch já foi desligado neste aparelho.
  }
}

export function notifyTavernMessageLocal(
  roomName: string,
  authorName: string,
  text: string,
  at: string,
): void {
  if (!tavernPushSupported() || Notification.permission !== "granted") return;
  const title = authorName + " · " + roomName;
  const base: NotificationOptions = {
    body: text + "\n" + formatDay(at),
    icon: ICON,
    tag: "tavern:" + roomName,
    requireInteraction: true,
  };
  if ("serviceWorker" in navigator) {
    void navigator.serviceWorker
      .getRegistration()
      .then((registration) => {
        if (registration?.active) {
          const rich: NotificationOptionsWithActions = {
            ...base,
            data: { url: "/tavern" },
            actions: [{ action: "reply", title: "Responder" }],
          };
          return registration.showNotification(title, rich);
        }
        plainNotice(title, base);
        void registerWorker();
      })
      .catch(() => plainNotice(title, base));
    return;
  }
  plainNotice(title, base);
}

export function dismissTavernNotices(roomName?: string): void {
  if (!tavernPushSupported() || Notification.permission !== "granted") return;
  if (!("serviceWorker" in navigator)) return;
  const wanted = roomName ? "tavern:" + roomName : null;
  void navigator.serviceWorker
    .getRegistration()
    .then((registration) => registration?.getNotifications() ?? [])
    .then((notices) => {
      for (const notice of notices) {
        if (!notice.tag.startsWith("tavern:")) continue;
        if (wanted && notice.tag !== wanted) continue;
        notice.close();
      }
    })
    .catch(() => {});
}

export function testTavernPush(): void {
  notifyTavernMessageLocal(
    "Taverna",
    "Wizold",
    "Notificação de teste: se você está vendo isto, está funcionando.",
    new Date().toISOString(),
  );
}

function plainNotice(title: string, options: NotificationOptions): void {
  try {
    const notice = new Notification(title, options);
    notice.onclick = () => {
      window.focus();
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/tavern");
      notice.close();
    };
  } catch {}
}
