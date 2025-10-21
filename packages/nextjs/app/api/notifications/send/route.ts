import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

// Configure VAPID keys (you'll need to set these in your environment)
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:your-email@example.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

interface NotificationPayload {
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

interface SendNotificationRequest {
  subscriptions: Array<{
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }>;
  notification: NotificationPayload;
}

export async function POST(request: NextRequest) {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
    }

    const { subscriptions, notification }: SendNotificationRequest = await request.json();

    if (!subscriptions || !Array.isArray(subscriptions) || subscriptions.length === 0) {
      return NextResponse.json({ error: "No subscriptions provided" }, { status: 400 });
    }

    if (!notification.title || !notification.body) {
      return NextResponse.json({ error: "Notification title and body are required" }, { status: 400 });
    }

    const results = await Promise.allSettled(
      subscriptions.map(async subscription => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          };

          await webpush.sendNotification(pushSubscription, JSON.stringify(notification));

          return { success: true, endpoint: subscription.endpoint };
        } catch (error) {
          console.error("Failed to send notification to:", subscription.endpoint, error);
          return {
            success: false,
            endpoint: subscription.endpoint,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }),
    );

    const successful = results.filter(result => result.status === "fulfilled" && result.value.success).length;

    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      message: `Sent notifications to ${successful} devices, ${failed} failed`,
      results: results.map(result =>
        result.status === "fulfilled" ? result.value : { success: false, error: "Promise rejected" },
      ),
    });
  } catch (error) {
    console.error("Error sending push notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to send a notification to all subscribed users
export async function sendNotificationToAll(notification: NotificationPayload) {
  // In a real application, you would fetch all subscriptions from your database
  // const subscriptions = await db.pushSubscriptions.findMany();

  // For now, return a function that can be called with subscriptions
  return async (subscriptions: Array<{ endpoint: string; keys: { p256dh: string; auth: string } }>) => {
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscriptions,
        notification,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send notifications: ${response.statusText}`);
    }

    return response.json();
  };
}
