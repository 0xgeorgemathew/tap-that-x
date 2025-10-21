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
    if (!subscription.endpoint || !subscription.keys.p256dh || !subscription.keys.auth) {
      return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
    }

    // Here you would typically save the subscription to your database
    // For now, we'll just log it
    console.log("New push subscription:", {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh.substring(0, 20) + "...",
      auth: subscription.keys.auth.substring(0, 20) + "...",
    });

    // In a real application, you would:
    // 1. Save the subscription to your database
    // 2. Associate it with the current user
    // 3. Possibly send a welcome notification

    // Example database save (pseudo-code):
    // await db.pushSubscriptions.create({
    //   data: {
    //     endpoint: subscription.endpoint,
    //     p256dh: subscription.keys.p256dh,
    //     auth: subscription.keys.auth,
    //     userId: getUserIdFromRequest(request),
    //     createdAt: new Date(),
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: "Subscription saved successfully",
    });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
