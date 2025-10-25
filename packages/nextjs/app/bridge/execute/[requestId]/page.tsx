"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

type FlowState = "loading" | "ready" | "wallet_connecting" | "sdk_initializing" | "bridging" | "success" | "error";

export default function BridgeExecutePage() {
  const params = useParams();
  const requestId = params.requestId as string;

  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [statusMessage, setStatusMessage] = useState<string>("Loading bridge request...");
  const [bridgeRequest, setBridgeRequest] = useState<any>(null);

  // Two-step initialization state
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [sdkInitialized, setSdkInitialized] = useState(false);
  const [sdk, setSdk] = useState<any>(null);

  // Load bridge request details
  useEffect(() => {
    if (!requestId) return;

    fetch(`/api/bridge-requests/${requestId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setFlowState("error");
          setStatusMessage(data.error);
          return;
        }

        setBridgeRequest(data);
        setFlowState("ready");
        setStatusMessage("Bridge request loaded. Follow the steps below to execute.");
      })
      .catch(err => {
        setFlowState("error");
        setStatusMessage("Failed to load bridge request: " + err.message);
      });
  }, [requestId]);

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            setWalletConnected(true);
            setWalletAddress(accounts[0]);
          }
        } catch {
          // Silent fail - user will connect manually
        }
      }
    };
    checkConnection();
  }, []);

  // STEP 1: Connect Wallet ONLY
  const handleConnectWallet = async () => {
    try {
      setFlowState("wallet_connecting");
      setStatusMessage("Connecting wallet...");

      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask not found. Please install MetaMask extension.");
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

      if (accounts.length === 0) {
        throw new Error("No accounts returned");
      }

      const addr = accounts[0];
      setWalletConnected(true);
      setWalletAddress(addr);
      setFlowState("ready");
      setStatusMessage("Wallet connected! Now initialize Nexus SDK (Step 2).");
    } catch (error: any) {
      setFlowState("error");
      setStatusMessage(error.message || "Failed to connect wallet");
    }
  };

  // STEP 2: Initialize SDK
  const handleInitializeSDK = async () => {
    try {
      setFlowState("sdk_initializing");
      setStatusMessage("Initializing Nexus SDK...");

      const { sdk, initializeWithProvider, isInitialized } = await import("~~/utils/nexus");

      // Check if already initialized globally
      if (isInitialized()) {
        setSdk(sdk);
        setSdkInitialized(true);
        setFlowState("ready");
        setStatusMessage("SDK already initialized! Now you can execute the bridge (Step 3).");
        return;
      }

      await initializeWithProvider(window.ethereum);

      setSdk(sdk);
      setSdkInitialized(true);
      setFlowState("ready");
      setStatusMessage("SDK initialized! Now you can execute the bridge (Step 3).");
    } catch (error: any) {
      setFlowState("error");
      setStatusMessage(`Failed to initialize Nexus SDK: ${error.message}`);
    }
  };

  // STEP 3: Execute Bridge
  const handleExecuteBridge = async () => {
    if (!bridgeRequest) {
      setStatusMessage("No bridge request loaded");
      setFlowState("error");
      return;
    }

    // Verify user owns this request
    if (walletAddress.toLowerCase() !== bridgeRequest.userAddress.toLowerCase()) {
      setStatusMessage("You are not the owner of this bridge request");
      setFlowState("error");
      return;
    }

    if (!sdk || !sdkInitialized) {
      setStatusMessage("SDK not initialized. Please complete steps 1 and 2 first.");
      setFlowState("error");
      return;
    }

    try {
      setFlowState("bridging");
      setStatusMessage("Preparing bridge transaction...");

      // Execute bridge - SDK will handle chain switching if needed
      const result = await sdk.bridge({
        token: "ETH",
        amount: parseFloat(bridgeRequest.amount) / 1e18, // Convert wei to ETH
        chainId: bridgeRequest.destChain,
        sourceChains: [bridgeRequest.sourceChain],
      });

      // Check if bridge was successful
      if (!(result as any).success) {
        throw new Error((result as any).error || "Bridge failed");
      }

      const txHash =
        (result as any).transactionHash || (result as any).txHash || (result as any).hash || "0x" + "0".repeat(64);

      // Mark request as completed
      await fetch(`/api/bridge-requests/${requestId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash }),
      });

      setFlowState("success");
      setStatusMessage(`Bridge successful! ${bridgeRequest.description}`);
    } catch (error: any) {
      setFlowState("error");
      setStatusMessage(error.message || "Bridge execution failed");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-white px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Bridge Execution</h1>
          <p className="mt-2 text-sm text-gray-600">Execute your bridge request</p>
        </div>

        {/* Status Indicators */}
        {flowState !== "loading" && flowState !== "error" && (
          <div className="mb-6 space-y-2 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${walletConnected ? "bg-green-500" : "bg-gray-400"}`} />
              <span className="text-sm font-medium text-gray-700">
                {walletConnected
                  ? `Wallet Connected (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)})`
                  : "Step 1: Connect Wallet"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${sdkInitialized ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
              />
              <span className="text-sm font-medium text-gray-700">
                {sdkInitialized ? "SDK Initialized" : "Step 2: Initialize Nexus SDK"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${flowState === "success" ? "bg-green-500" : "bg-gray-400"}`} />
              <span className="text-sm font-medium text-gray-700">
                {flowState === "success" ? "Bridge Completed" : "Step 3: Execute Bridge"}
              </span>
            </div>
          </div>
        )}

        {/* Status Icon */}
        <div className="mb-6 flex justify-center">
          {flowState === "loading" && <Loader2 className="h-16 w-16 animate-spin text-indigo-600" />}
          {flowState === "ready" && <CheckCircle2 className="h-16 w-16 text-green-500" />}
          {flowState === "wallet_connecting" && <Loader2 className="h-16 w-16 animate-spin text-blue-600" />}
          {flowState === "sdk_initializing" && <Loader2 className="h-16 w-16 animate-spin text-indigo-600" />}
          {flowState === "bridging" && <Loader2 className="h-16 w-16 animate-spin text-purple-600" />}
          {flowState === "success" && <CheckCircle2 className="h-16 w-16 text-green-500" />}
          {flowState === "error" && <AlertCircle className="h-16 w-16 text-red-500" />}
        </div>

        {/* Status Message */}
        <div className="mb-6 text-center">
          <p className="text-lg font-medium text-gray-900">{statusMessage}</p>
        </div>

        {/* Bridge Details */}
        {bridgeRequest && flowState !== "loading" && (
          <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="text-sm font-medium text-gray-900">
                {(parseFloat(bridgeRequest.amount) / 1e18).toFixed(4)} ETH
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">From Chain:</span>
              <span className="text-sm font-medium text-gray-900">{bridgeRequest.sourceChain}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">To Chain:</span>
              <span className="text-sm font-medium text-gray-900">{bridgeRequest.destChain}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className="text-sm font-medium text-gray-900">{bridgeRequest.status}</span>
            </div>
          </div>
        )}

        {/* Action Buttons - Three Steps */}
        {flowState !== "loading" && flowState !== "success" && (
          <div className="space-y-3">
            {/* STEP 1: Connect Wallet */}
            <button
              onClick={handleConnectWallet}
              disabled={walletConnected || flowState === "wallet_connecting"}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {walletConnected
                ? "✅ Wallet Connected"
                : flowState === "wallet_connecting"
                  ? "Connecting..."
                  : "1️⃣ Connect Wallet"}
            </button>

            {/* STEP 2: Initialize SDK */}
            <button
              onClick={handleInitializeSDK}
              disabled={!walletConnected || sdkInitialized || flowState === "sdk_initializing"}
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sdkInitialized
                ? "✅ SDK Initialized"
                : flowState === "sdk_initializing"
                  ? "Initializing..."
                  : "2️⃣ Initialize Nexus"}
            </button>

            {/* STEP 3: Execute Bridge */}
            <button
              onClick={handleExecuteBridge}
              disabled={!sdkInitialized || flowState === "bridging"}
              className="w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {flowState === "bridging" ? "Bridging..." : "3️⃣ Execute Bridge"}
            </button>
          </div>
        )}

        {/* Success State */}
        {flowState === "success" && (
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <p className="text-sm font-medium text-green-800">Bridge completed successfully!</p>
          </div>
        )}

        {/* Request ID */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">Request ID: {requestId?.slice(0, 10)}...</p>
        </div>
      </div>
    </div>
  );
}
