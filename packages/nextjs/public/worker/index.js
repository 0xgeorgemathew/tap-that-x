// Service Worker for TapThatX PWA
self.addEventListener("push", event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "TapThatX";
  const body = data.body || event.data?.text() || "You have a new notification";
  const icon = data.icon || "/favicon.png";
  const badge = data.badge || "/favicon.png";
  const tag = data.tag || "default";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      requireInteraction: false,
      actions: data.actions || [],
      data: data.data || {},
    }),
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  if (event.action) {
    // Handle action clicks
    console.log("Action clicked:", event.action);
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      return self.clients.openWindow("/");
    }),
  );
});

self.addEventListener("notificationclose", event => {
  console.log("Notification closed:", event.notification.tag);
});

// Handle background sync for offline functionality
self.addEventListener("sync", event => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Implement background sync logic here
  return Promise.resolve();
}

// Handle message from main thread
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
