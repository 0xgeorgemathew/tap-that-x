"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Bell, CheckCircle2, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";

type SetupState = "idle" | "checking" | "subscribing" | "subscribed" | "error";

export default function BridgeSetupPage() {
  const { address } = useAccount();
  const [setupState, setSetupState] = useState<SetupState>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isSupported, setIsSupported] = useState<boolean>(true);

  useEffect(() => {
    // Check if push notifications are supported
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setIsSupported(false);
      setStatusMessage("Push notifications not supported in this browser");
      setSetupState("error");
    }
  }, []);

  const handleSubscribe = async () => {
    if (!address) {
      setStatusMessage("Please connect your wallet first");
      setSetupState("error");
      return;
    }

    try {
      setSetupState("subscribing");
      setStatusMessage("Registering service worker...");

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      setStatusMessage("Requesting notification permission...");

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission denied");
      }

      setStatusMessage("Creating push subscription...");

      // Get VAPID public key from server
      const vapidResponse = await fetch("/api/subscribe-push");
      const { publicKey } = await vapidResponse.json();

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });

      setStatusMessage("Saving subscription...");

      // Send subscription to server
      const response = await fetch("/api/subscribe-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: address,
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription");
      }

      setSetupState("subscribed");
      setStatusMessage("Successfully subscribed! You will now receive bridge notifications.");
    } catch (error: any) {
      setSetupState("error");
      setStatusMessage(error.message || "Failed to subscribe");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-white px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Bell className="h-16 w-16 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Bridge Notifications</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enable push notifications to approve bridge requests from your mobile device
          </p>
        </div>

        {/* Status Icon */}
        {setupState !== "idle" && (
          <div className="mb-6 flex justify-center">
            {setupState === "subscribing" && <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />}
            {setupState === "subscribed" && <CheckCircle2 className="h-12 w-12 text-green-500" />}
            {setupState === "error" && <AlertCircle className="h-12 w-12 text-red-500" />}
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-700">{statusMessage}</p>
          </div>
        )}

        {/* How it Works */}
        {setupState === "idle" && (
          <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4">
            <h3 className="font-medium text-gray-900">How it works:</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li>1. Enable notifications on this device (desktop)</li>
              <li>2. Configure bridge action on your chip</li>
              <li>3. Tap chip on mobile device</li>
              <li>4. Receive notification on desktop</li>
              <li>5. Click notification to approve bridge</li>
            </ol>
          </div>
        )}

        {/* Subscribe Button */}
        {setupState === "idle" && isSupported && (
          <button
            onClick={handleSubscribe}
            disabled={!address}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {address ? "Enable Notifications" : "Connect Wallet First"}
          </button>
        )}

        {/* Success Actions */}
        {setupState === "subscribed" && (
          <div className="space-y-3">
            <Link
              href="/configure"
              className="block w-full rounded-lg bg-indigo-600 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Configure Bridge Action
            </Link>
            <Link
              href="/"
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Back to Home
            </Link>
          </div>
        )}

        {/* Browser Not Supported */}
        {!isSupported && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            Your browser doesn&apos;t support push notifications. Please use Chrome, Firefox, or Edge.
          </div>
        )}
      </div>
    </div>
  );
}
