import { NextRequest, NextResponse } from "next/server";

interface SubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const subscription: SubscriptionData = await request.json();

    // Validate the subscription data
    if (!subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
    }

    // Here you would typically remove the subscription from your database
    console.log("Removing push subscription:", {
      endpoint: subscription.endpoint,
    });

    // In a real application, you would:
    // 1. Find and remove the subscription from your database
    // 2. Clean up any associated data

    // Example database removal (pseudo-code):
    // await db.pushSubscriptions.deleteMany({
    //   where: {
    //     endpoint: subscription.endpoint,
    //     userId: getUserIdFromRequest(request),
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: "Subscription removed successfully",
    });
  } catch (error) {
    console.error("Error removing push subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
