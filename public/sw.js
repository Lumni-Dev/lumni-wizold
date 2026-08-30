// Notification-only service worker. It caches nothing and never touches fetch,
// it exists so a tavern message notification can carry a "Responder" action and
// open the tavern when the notification (or that action) is clicked.
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
