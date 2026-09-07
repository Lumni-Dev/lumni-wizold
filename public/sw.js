self.addEventListener("push", (event) => {
  // The payload arrives already localized to the receiver's stored language;
  // these defaults only cover a payload-less push.
  let payload = {
    title: "Wizold",
    body: "New message in the tavern.",
    reply: "Reply",
    url: "/tavern",
    roomName: "Tavern",
  };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {}
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      if (windows.some((client) => client.visibilityState === "visible")) return;
      return self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: "/assets/ui/tavern-mug.png?v=3",
        tag: "tavern:" + payload.roomName,
        data: { url: payload.url || "/tavern" },
        requireInteraction: true,
        actions: [{ action: "reply", title: payload.reply || "Reply" }],
      });
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/tavern";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => client.url.includes("/tavern"));
      if (open) return open.focus();
      const any = windows.find((client) => "focus" in client);
      if (any && "navigate" in any) {
        return any.navigate(url).then((client) => (client || any).focus());
      }
      return self.clients.openWindow ? self.clients.openWindow(url) : undefined;
    }),
  );
});
