"use client";

import { tavernPushRepository } from "@/models/repositories/tavern-push.repository";
import { formatDay } from "@/shared/utils/format";

const SW_URL = "/sw.js";
const ICON = "/assets/ui/caneca.png";

// The DOM lib dropped `actions` from NotificationOptions, but a service-worker
// notification still honours it, so widen the type where we use the worker.
interface NotificationOptionsWithActions extends NotificationOptions {
  actions?: { action: string; title: string }[];
}

export function tavernPushSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

// Both the switch and the granted permission have to line up for a notice to fire.
export function tavernPushActive(): boolean {
  return (
    tavernPushSupported() && tavernPushRepository.enabled() && Notification.permission === "granted"
  );
}

// Turn it on: ask the browser, keep the setting only if the user accepts, and
// register the worker that owns the Responder action. Returns the permission so
// the screen can flip to Desativado on a deny.
export async function enableTavernPush(): Promise<NotificationPermission> {
  if (!tavernPushSupported()) {
    tavernPushRepository.setEnabled(false);
    return "denied";
  }
  let permission = Notification.permission;
  if (permission === "default") permission = await Notification.requestPermission();
  const granted = permission === "granted";
  tavernPushRepository.setEnabled(granted);
  if (granted && "serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register(SW_URL);
    } catch {}
  }
  return permission;
}

export function disableTavernPush(): void {
  tavernPushRepository.setEnabled(false);
}

// One desktop notice for a tavern message: the sender and table on the title,
// the message and its date on the body, plus a Responder action that opens the
// tavern (the service worker handles the click). Falls back to a plain, still
// clickable notice where a worker is not available.
export function notifyTavernMessage(
  roomName: string,
  authorName: string,
  text: string,
  at: string,
): void {
  if (!tavernPushActive()) return;

  const title = authorName + " · " + roomName;
  const base: NotificationOptions = {
    body: text + "\n" + formatDay(at),
    icon: ICON,
    tag: "tavern:" + roomName,
  };

  if ("serviceWorker" in navigator) {
    const rich: NotificationOptionsWithActions = {
      ...base,
      data: { url: "/tavern" },
      actions: [{ action: "reply", title: "Responder" }],
    };
    void navigator.serviceWorker.ready
      .then((registration) => registration.showNotification(title, rich))
      .catch(() => plainNotice(title, base));
    return;
  }
  plainNotice(title, base);
}

function plainNotice(title: string, options: NotificationOptions): void {
  try {
    const notice = new Notification(title, options);
    notice.onclick = () => {
      window.focus();
      // A plain notification click has no router in reach; a hard nav is fine on
      // this rare no-service-worker fallback.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/tavern");
      notice.close();
    };
  } catch {}
}
