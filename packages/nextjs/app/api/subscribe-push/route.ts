import { NextRequest, NextResponse } from "next/server";
import { getVapidPublicKey, savePushSubscription } from "~~/utils/pushNotifications";

/**
 * POST /api/subscribe-push
 * Save push notification subscription for a user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userAddress, subscription } = body;

    // Validate inputs
    if (!userAddress || !subscription) {
      return NextResponse.json({ error: "Missing userAddress or subscription" }, { status: 400 });
    }

    // Validate subscription format
    if (!subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Invalid subscription format" }, { status: 400 });
    }

    // Save to database
    await savePushSubscription(userAddress, subscription);

    return NextResponse.json({
      success: true,
      message: "Push subscription saved successfully",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save subscription" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/subscribe-push
 * Get VAPID public key for client-side subscription
 */
export async function GET() {
  try {
    const publicKey = getVapidPublicKey();
    return NextResponse.json({ publicKey });
  } catch {
    return NextResponse.json({ error: "Failed to get VAPID key" }, { status: 500 });
  }
}
