import { query } from "./db";
import webpush from "web-push";

// Initialize web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidSubject = process.env.VAPID_SUBJECT!;

// Configure VAPID details for web-push
webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

/**
 * Bridge notification payload structure
 */
export interface BridgeNotificationPayload {
  requestId: string;
  amount: string;
  token: string;
  destChainName: string;
  sourceChainName: string;
  sourceChainId: number;
  destChainId: number;
  url: string; // URL to bridge execution page
}

/**
 * Send bridge notification to user's subscribed devices
 * @param userAddress User's wallet address
 * @param payload Notification payload with bridge details
 */
export async function sendBridgeNotification(userAddress: string, payload: BridgeNotificationPayload): Promise<void> {
  // Get user's push subscriptions from database
  const result = await query(
    "SELECT subscription_endpoint, subscription_keys FROM push_subscriptions WHERE user_address = $1",
    [userAddress.toLowerCase()],
  );

  if (result.rows.length === 0) {
    throw new Error(`No push subscription found for user ${userAddress}`);
  }

  // Send notification to all user's subscriptions (desktop, mobile, etc.)
  const promises = result.rows.map(async (row: any) => {
    const subscription = {
      endpoint: row.subscription_endpoint,
      keys: row.subscription_keys,
    };

    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (error: any) {
      // Handle expired or invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        await query("DELETE FROM push_subscriptions WHERE subscription_endpoint = $1", [row.subscription_endpoint]);
      } else {
        throw error;
      }
    }
  });

  await Promise.all(promises);
}

/**
 * Get VAPID public key for client-side subscription
 * @returns VAPID public key
 */
export function getVapidPublicKey(): string {
  return vapidPublicKey;
}

/**
 * Save push subscription to database
 * @param userAddress User's wallet address
 * @param subscription Push subscription object from browser (already JSON)
 */
export async function savePushSubscription(userAddress: string, subscription: any): Promise<void> {
  const endpoint = subscription.endpoint;
  const keys = {
    p256dh: subscription.keys?.p256dh,
    auth: subscription.keys?.auth,
  };

  // Upsert subscription (insert or update if exists)
  await query(
    `
    INSERT INTO push_subscriptions (user_address, subscription_endpoint, subscription_keys, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (user_address, subscription_endpoint)
    DO UPDATE SET
      subscription_keys = $3,
      updated_at = NOW()
  `,
    [userAddress.toLowerCase(), endpoint, JSON.stringify(keys)],
  );
}

/**
 * Get chain name from chain ID
 * Helper function for notification messages
 */
export function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    1: "Ethereum",
    10: "Optimism",
    137: "Polygon",
    8453: "Base",
    42161: "Arbitrum",
    11155111: "Sepolia",
    84532: "Base Sepolia",
  };

  return chainNames[chainId] || `Chain ${chainId}`;
}
