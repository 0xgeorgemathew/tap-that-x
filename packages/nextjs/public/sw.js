// Service Worker for TapThat X Bridge Notifications
const SW_VERSION = "2.0.0";

// Push event - receive notification from backend
self.addEventListener("push", event => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    // Convert amount from wei to readable format
    const amountInWei = data.amount;
    const amountInEth = (parseFloat(amountInWei) / 1e18).toFixed(4);

    const title = "TapThat X - Bridge Request";
    const options = {
      body: `Bridge ${amountInEth} ${data.token} from ${data.sourceChainName} to ${data.destChainName}`,
      icon: "/favicon.png",
      tag: `bridge-${data.requestId}`,
      requireInteraction: true,
      data: {
        url: data.url || `/bridge/execute/${data.requestId}`,
        requestId: data.requestId,
      },
    };

    // Show notification
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    // Silently fail - user won't receive notification but won't break the app
  }
});

// Notification click event - open bridge page
self.addEventListener("notificationclick", event => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/bridge";
  const fullUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      // Find existing app window and navigate it
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin)) {
          client.postMessage({ type: "NAVIGATE", url: fullUrl });
          return client.focus();
        }
      }
      // No existing window - open new one
      return clients.openWindow(fullUrl);
    }),
  );
});

// Install - activate immediately
self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

// Activate - claim all clients
self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});
