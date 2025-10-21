"use client";

import React, { useEffect, useState } from "react";
import {
  getNotificationPermission,
  getPushSubscription,
  isIOSDevice,
  isNotificationSupported,
  isPushNotificationSupported,
  removeSubscriptionFromServer,
  requestNotificationPermission,
  sendSubscriptionToServer,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "../lib/notifications";

interface NotificationManagerProps {
  className?: string;
}

export function NotificationManager({ className }: NotificationManagerProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // You'll need to set this in your environment variables
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    const checkNotificationSupport = () => {
      const basicSupported = isNotificationSupported();
      const pushSupported = isPushNotificationSupported();
      const iosDevice = isIOSDevice();

      setIsSupported(basicSupported);
      setIsPushSupported(pushSupported);
      setIsIOS(iosDevice);

      if (basicSupported) {
        setPermission(getNotificationPermission());
        if (pushSupported) {
          checkExistingSubscription();
        }
      }
    };

    const checkExistingSubscription = async () => {
      try {
        const existingSub = await getPushSubscription();
        if (existingSub) {
          setSubscription(existingSub);
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error("Error checking existing subscription:", error);
      }
    };

    checkNotificationSupport();
  }, []);

  const handleEnableNotifications = async () => {
    if (!vapidPublicKey) {
      alert("VAPID public key is not configured. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable.");
      return;
    }

    setIsLoading(true);
    try {
      // Request permission first
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);

      if (newPermission === "granted") {
        // Subscribe to push notifications
        const newSubscription = await subscribeToPushNotifications(vapidPublicKey);
        setSubscription(newSubscription);
        setIsSubscribed(true);

        // Send subscription to server
        try {
          await sendSubscriptionToServer(newSubscription);
          console.log("Subscription sent to server successfully");
        } catch (error) {
          console.error("Failed to send subscription to server:", error);
          // Continue anyway - the subscription is still valid for local notifications
        }
      }
    } catch (error) {
      console.error("Failed to enable notifications:", error);
      alert("Failed to enable notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    try {
      if (subscription) {
        // Remove from server first
        try {
          await removeSubscriptionFromServer(subscription);
        } catch (error) {
          console.error("Failed to remove subscription from server:", error);
          // Continue with local unsubscribe anyway
        }

        // Unsubscribe locally
        const success = await unsubscribeFromPushNotifications();
        if (success) {
          setSubscription(null);
          setIsSubscribed(false);
        }
      }
    } catch (error) {
      console.error("Failed to disable notifications:", error);
      alert("Failed to disable notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = () => {
    if (permission === "granted") {
      new Notification("TapThatX Test", {
        body: "This is a test notification from TapThatX!",
        icon: "/favicon.png",
        tag: "test",
      });
    }
  };

  // Show iOS-specific message
  if (isIOS) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="p-4 bg-blue-100 border border-blue-400 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-blue-800">iOS Safari Limitations</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              <strong>Push notifications are not supported</strong> in Safari on iOS devices, including installed PWAs.
            </p>
            <p>This is a limitation set by Apple to encourage App Store usage.</p>

            <div className="mt-3">
              <p className="font-medium">Alternatives:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Use the app on desktop Safari or Chrome (push notifications work)</li>
                <li>Check the app manually for updates</li>
                <li>Local notifications will work when the app is open</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Test local notification button for iOS */}
        {permission === "granted" && (
          <button onClick={testNotification} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Test Local Notification
          </button>
        )}
      </div>
    );
  }

  // Show general unsupported message for other browsers
  if (!isSupported) {
    return (
      <div className={`p-4 bg-yellow-100 border border-yellow-400 rounded-lg ${className}`}>
        <p className="text-yellow-800">Push notifications are not supported in this browser.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">{isPushSupported ? "Push Notifications" : "Local Notifications"}</h3>
        <p className="text-sm text-gray-600 mb-4">
          {isPushSupported
            ? "Enable notifications to receive updates about payments, chip registrations, and important alerts."
            : "Local notifications will work when the app is open. Push notifications are not available in this browser."}
        </p>

        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">Permission:</span>{" "}
            <span
              className={`capitalize ${
                permission === "granted"
                  ? "text-green-600"
                  : permission === "denied"
                    ? "text-red-600"
                    : "text-yellow-600"
              }`}
            >
              {permission}
            </span>
          </p>

          <p className="text-sm">
            <span className="font-medium">Status:</span>{" "}
            <span className={isSubscribed && isPushSupported ? "text-green-600" : "text-gray-600"}>
              {isPushSupported ? (isSubscribed ? "Push Enabled" : "Push Disabled") : "Local Only"}
            </span>
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {permission !== "granted" || (!isSubscribed && isPushSupported) ? (
          <button
            onClick={handleEnableNotifications}
            disabled={isLoading || permission === "denied"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Enabling..." : isPushSupported ? "Enable Push Notifications" : "Enable Local Notifications"}
          </button>
        ) : isPushSupported && isSubscribed ? (
          <button
            onClick={handleDisableNotifications}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? "Disabling..." : "Disable Notifications"}
          </button>
        ) : null}

        {permission === "granted" && (
          <button
            onClick={testNotification}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Test Notification
          </button>
        )}
      </div>

      {permission === "denied" && (
        <div className="p-4 bg-red-100 border border-red-400 rounded-lg">
          <p className="text-red-800 text-sm">
            Notifications are blocked. To enable them, click on the lock icon in your browser&apos;s address bar and
            allow notifications for this site.
          </p>
        </div>
      )}

      {!vapidPublicKey && (
        <div className="p-4 bg-orange-100 border border-orange-400 rounded-lg">
          <p className="text-orange-800 text-sm">
            <strong>Configuration needed:</strong> VAPID public key is not set. Add{" "}
            <code>NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> to your environment variables to enable push notifications.
          </p>
        </div>
      )}
      {!isPushSupported && !isIOS && (
        <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
          <p className="text-gray-700 text-sm">
            <strong>Browser Compatibility:</strong> Push notifications work best in Chrome, Edge, and Firefox. Local
            notifications are available when the app is open.
          </p>
        </div>
      )}
    </div>
  );
}
