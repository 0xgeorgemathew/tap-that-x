/**
 * Notification utilities for TapThatX PWA
 */

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface SubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Convert base64 string to Uint8Array for VAPID keys
 */
export function base64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported(): boolean {
  const hasBasicSupport = "Notification" in window && "serviceWorker" in navigator;

  // Check for iOS Safari specifically
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS) {
    // iOS Safari and iOS PWAs don't support push notifications
    return false;
  }

  // For other browsers, check for PushManager support
  return hasBasicSupport && "PushManager" in window;
}

/**
 * Check if push notifications are supported (different from basic notifications)
 */
export function isPushNotificationSupported(): boolean {
  return isNotificationSupported() && "PushManager" in window;
}

/**
 * Check if we're running on iOS
 */
export function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    throw new Error("Notifications are not supported in this browser");
  }

  return Notification.requestPermission();
}

/**
 * Get the current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  return Notification.permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(vapidPublicKey: string): Promise<PushSubscription> {
  if (!isNotificationSupported()) {
    throw new Error("Push notifications are not supported");
  }

  const registration = await navigator.serviceWorker.ready;

  // Check if already subscribed
  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    return existingSubscription;
  }

  // Create new subscription
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64ToUint8Array(vapidPublicKey) as BufferSource,
  });

  return subscription;
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    return subscription.unsubscribe();
  }

  return false;
}

/**
 * Get current push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isNotificationSupported()) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

/**
 * Show a local notification (not push)
 */
export function showLocalNotification(data: NotificationData): void {
  if (getNotificationPermission() !== "granted") {
    console.warn("Notification permission not granted");
    return;
  }

  new Notification(data.title, {
    body: data.body,
    icon: data.icon || "/favicon.png",
    badge: data.badge || "/favicon.png",
    tag: data.tag,
    data: data.data,
  });
}

/**
 * Convert push subscription to a serializable format
 */
export function serializePushSubscription(subscription: PushSubscription): SubscriptionData {
  const keys = subscription.getKey
    ? {
        p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
        auth: arrayBufferToBase64(subscription.getKey("auth")),
      }
    : { p256dh: "", auth: "" };

  return {
    endpoint: subscription.endpoint,
    keys,
  };
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Send subscription to server (you'll need to implement the server endpoint)
 */
export async function sendSubscriptionToServer(subscription: PushSubscription, userToken?: string): Promise<Response> {
  const subscriptionData = serializePushSubscription(subscription);

  const response = await fetch("/api/notifications/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(userToken && { Authorization: `Bearer ${userToken}` }),
    },
    body: JSON.stringify(subscriptionData),
  });

  if (!response.ok) {
    throw new Error(`Failed to send subscription to server: ${response.statusText}`);
  }

  return response;
}

/**
 * Remove subscription from server
 */
export async function removeSubscriptionFromServer(
  subscription: PushSubscription,
  userToken?: string,
): Promise<Response> {
  const subscriptionData = serializePushSubscription(subscription);

  const response = await fetch("/api/notifications/unsubscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(userToken && { Authorization: `Bearer ${userToken}` }),
    },
    body: JSON.stringify(subscriptionData),
  });

  if (!response.ok) {
    throw new Error(`Failed to remove subscription from server: ${response.statusText}`);
  }

  return response;
}
