"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Repeat } from "lucide-react";
import { formatUnits } from "viem";
import { getChainName } from "~~/utils/chainHelpers";
import { type BridgeRequestData, verifyBridgeRequest } from "~~/utils/chipSignatureVerifier";

type FlowState =
  | "loading"
  | "verifying"
  | "ready"
  | "wallet_connecting"
  | "sdk_initializing"
  | "bridging"
  | "success"
  | "error";

export default function BridgeExecutePage() {
  const params = useParams();
  const requestId = params.requestId as string;

  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [statusMessage, setStatusMessage] = useState<string>("Loading bridge request...");
  const [bridgeRequest, setBridgeRequest] = useState<BridgeRequestData | null>(null);

  // Two-step initialization state
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [sdkInitialized, setSdkInitialized] = useState(false);
  const [sdk, setSdk] = useState<any>(null);

  // Verification state
  const [isVerified, setIsVerified] = useState(false);
  const [recoveredChipAddress, setRecoveredChipAddress] = useState<string>("");

  // Load bridge request details
  useEffect(() => {
    if (!requestId) return;

    const loadBridgeRequest = async () => {
      try {
        const res = await fetch(`/api/bridge-requests/${requestId}`);
        const data = await res.json();

        if (data.error) {
          setFlowState("error");
          setStatusMessage(data.error);
          return;
        }

        setBridgeRequest(data);
        setFlowState("verifying");
        setStatusMessage("Verifying chip signature and wallet ownership...");
      } catch (err: any) {
        setFlowState("error");
        setStatusMessage(`Failed to load bridge request: ${err.message}`);
      }
    };

    loadBridgeRequest();
  }, [requestId]);

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum === "undefined") return;

      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setWalletConnected(true);
          setWalletAddress(accounts[0]);
        }
      } catch {
        // Silent fail - user will connect manually
      }
    };
    checkConnection();
  }, []);

  // Verify bridge request when both wallet and bridge request are loaded
  useEffect(() => {
    const performVerification = async () => {
      if (!bridgeRequest || !walletAddress) return;

      setFlowState("verifying");
      setStatusMessage("Verifying chip signature and wallet ownership...");

      // Get the TapThatXProtocol address for the source chain
      const deployedContracts = await import("~~/contracts/deployedContracts");
      const contracts = deployedContracts.default[
        bridgeRequest.sourceChain as keyof typeof deployedContracts.default
      ] as any;
      const protocolAddress = contracts?.TapThatXProtocol?.address;

      if (!protocolAddress) {
        setIsVerified(false);
        setFlowState("error");
        setStatusMessage(`TapThatXProtocol not deployed on source chain ${bridgeRequest.sourceChain}`);
        return;
      }

      const result = await verifyBridgeRequest(bridgeRequest, walletAddress, protocolAddress);

      if (!result.isValid) {
        setIsVerified(false);
        setFlowState("error");
        setStatusMessage(`Security verification failed: ${result.error}`);
        return;
      }

      setIsVerified(true);
      setRecoveredChipAddress(result.recoveredChipAddress || "");
      setFlowState("ready");
      setStatusMessage("");
    };

    performVerification();
  }, [bridgeRequest, walletAddress]);

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
      setStatusMessage("");
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

      if (!isInitialized()) {
        await initializeWithProvider(window.ethereum);
      }

      setSdk(sdk);
      setSdkInitialized(true);
      setFlowState("ready");
      setStatusMessage("");
    } catch (error: any) {
      setFlowState("error");
      setStatusMessage(`Failed to initialize Nexus SDK: ${error.message}`);
    }
  };

  // STEP 3: Execute Bridge
  const handleExecuteBridge = async () => {
    // Validation checks
    if (!bridgeRequest) {
      setStatusMessage("No bridge request loaded");
      setFlowState("error");
      return;
    }

    if (!isVerified) {
      setStatusMessage("Security verification failed. Cannot execute bridge.");
      setFlowState("error");
      return;
    }

    if (walletAddress.toLowerCase() !== bridgeRequest.userAddress.toLowerCase()) {
      setStatusMessage("You are not the owner of this bridge request");
      setFlowState("error");
      return;
    }

    if (!sdk || !sdkInitialized) {
      setStatusMessage("SDK not initialized. Please initialize Nexus first.");
      setFlowState("error");
      return;
    }

    try {
      setFlowState("bridging");
      setStatusMessage("Preparing bridge transaction...");

      // Execute bridge - SDK will handle chain switching if needed
      // Convert wei (string) to ETH (number) using formatUnits for precision
      const amountInEth = Number(formatUnits(BigInt(bridgeRequest.amount), 18));

      const result = await sdk.bridge({
        token: "ETH",
        amount: amountInEth,
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
      setStatusMessage(
        `Bridge successful! ${formatUnits(BigInt(bridgeRequest.amount), 18)} ETH to ${getChainName(bridgeRequest.destChain)}`,
      );
    } catch (error: any) {
      setFlowState("error");
      setStatusMessage(error.message || "Bridge execution failed");
    }
  };

  return (
    <div className="min-h-screen p-2 bg-gradient-to-br from-base-200/30 to-base-300/20">
      <div className="w-full max-w-2xl mx-auto py-2">
        {/* Main Glass Card */}
        <div className="glass-card pt-5 px-5 pb-0.5 sm:pt-6 sm:px-6 sm:pb-0.5 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="mb-3">
            <div className="flex flex-col items-center text-center">
              <div className="round-icon w-12 h-12 mb-2 shadow-lg">
                <Repeat className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-lg font-bold text-base-content tracking-tight mb-1">
                {flowState === "success"
                  ? "Bridge Complete!"
                  : flowState === "bridging"
                    ? "Bridging in Progress..."
                    : "Cross-Chain Bridge"}
              </h1>
              {bridgeRequest && (
                <p className="text-xs text-base-content/70">
                  {formatUnits(BigInt(bridgeRequest.amount), 18)} ETH: {getChainName(bridgeRequest.sourceChain)} →{" "}
                  {getChainName(bridgeRequest.destChain)}
                </p>
              )}
            </div>
          </div>

          {/* Status Indicators - 5 Step Flow */}
          {flowState !== "loading" && flowState !== "error" && bridgeRequest && (
            <div className="mb-3 rounded-2xl bg-base-100/10 backdrop-blur-md p-4 border border-base-content/15 shadow-inner">
              <div className="space-y-1.5">
                {/* Step 1: Verify Authorized Wallet */}
                <div className="flex items-center gap-5" role="status" aria-live="polite">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold transition-all duration-300 ${
                        walletConnected && isVerified
                          ? "bg-success text-white shadow-lg shadow-success/30"
                          : "bg-base-content/10 text-base-content/40"
                      }`}
                    >
                      {walletConnected && isVerified ? "✓" : "1"}
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-base-content/90">Verify Authorized Wallet</p>
                    </div>
                  </div>
                </div>

                {/* Connecting Line */}
                <div className="flex items-center gap-5">
                  <div className="w-10 flex justify-center">
                    <div className={`w-0.5 h-3 ${recoveredChipAddress ? "bg-success" : "bg-base-content/10"}`}></div>
                  </div>
                </div>

                {/* Step 2: Recover Chip Address */}
                <div className="flex items-start gap-5" role="status" aria-live="polite">
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold transition-all duration-300 ${
                          recoveredChipAddress
                            ? "bg-success text-white shadow-lg shadow-success/30"
                            : "bg-base-content/10 text-base-content/40"
                        }`}
                      >
                        {recoveredChipAddress ? (
                          "✓"
                        ) : flowState === "verifying" ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          "2"
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-base-content/90">Detected Chip Address</p>
                        {recoveredChipAddress && (
                          <p className="text-xs text-base-content/60 mt-1.5 font-mono break-all">
                            {recoveredChipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connecting Line */}
                <div className="flex items-center gap-5">
                  <div className="w-10 flex justify-center">
                    <div className={`w-0.5 h-3 ${isVerified ? "bg-success" : "bg-base-content/10"}`}></div>
                  </div>
                </div>

                {/* Step 3: Verify Chip Signature */}
                <div className="flex items-start gap-5" role="status" aria-live="polite">
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold transition-all duration-300 ${
                          isVerified
                            ? "bg-success text-white shadow-lg shadow-success/30"
                            : "bg-base-content/10 text-base-content/40"
                        }`}
                      >
                        {isVerified ? (
                          "✓"
                        ) : flowState === "verifying" ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          "3"
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-base-content/90">Verify Chip Signature</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connecting Line */}
                <div className="flex items-center gap-5">
                  <div className="w-10 flex justify-center">
                    <div className={`w-0.5 h-3 ${sdkInitialized ? "bg-success" : "bg-base-content/10"}`}></div>
                  </div>
                </div>

                {/* Step 4: Initialize Nexus */}
                <div className="flex items-center gap-5" role="status" aria-live="polite">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold transition-all duration-300 ${
                        sdkInitialized
                          ? "bg-success text-white shadow-lg shadow-success/30"
                          : "bg-base-content/10 text-base-content/40"
                      }`}
                    >
                      {sdkInitialized ? (
                        "✓"
                      ) : flowState === "sdk_initializing" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "4"
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-base-content/90">Initialize Nexus</p>
                    </div>
                  </div>
                </div>

                {/* Connecting Line */}
                <div className="flex items-center gap-5">
                  <div className="w-10 flex justify-center">
                    <div className={`w-0.5 h-3 ${flowState === "success" ? "bg-success" : "bg-base-content/10"}`}></div>
                  </div>
                </div>

                {/* Step 5: Bridge Execution */}
                <div className="flex items-center gap-5" role="status" aria-live="polite">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold transition-all duration-300 ${
                        flowState === "success"
                          ? "bg-success text-white shadow-lg shadow-success/30"
                          : "bg-base-content/10 text-base-content/40"
                      }`}
                    >
                      {flowState === "success" ? (
                        "✓"
                      ) : flowState === "bridging" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "5"
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-base-content/90">Bridge Execution</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Message - Compact */}
          {flowState === "error" && (
            <div className="mb-3">
              <div className="glass-alert-error" role="alert">
                <p className="text-sm break-words">{statusMessage}</p>
                {bridgeRequest && !isVerified && (
                  <p className="mt-2 text-xs opacity-80">
                    Expected: {bridgeRequest.userAddress.slice(0, 8)}...{bridgeRequest.userAddress.slice(-6)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          {flowState === "success" && statusMessage && (
            <div className="mb-3">
              <div className="rounded-xl bg-success/10 border border-success/30 p-2.5 text-center">
                <p className="text-sm text-success font-medium">{statusMessage}</p>
              </div>
            </div>
          )}

          {/* Action Buttons - Grid Layout */}
          {flowState !== "loading" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-4">
              {/* STEP 1: Connect Wallet */}
              <button
                onClick={handleConnectWallet}
                disabled={walletConnected || flowState === "wallet_connecting"}
                className="glass-btn h-10 text-sm font-semibold transition-all hover:scale-105"
                aria-label="Connect wallet"
              >
                {walletConnected
                  ? "✓ Connected"
                  : flowState === "wallet_connecting"
                    ? "Connecting..."
                    : "Connect Wallet"}
              </button>

              {/* STEP 2: Initialize Nexus */}
              <button
                onClick={handleInitializeSDK}
                disabled={!walletConnected || !isVerified || sdkInitialized || flowState === "sdk_initializing"}
                className="glass-btn h-10 text-sm font-semibold transition-all hover:scale-105"
                aria-label="Initialize Nexus"
              >
                {sdkInitialized
                  ? "✓ Initialize Nexus"
                  : flowState === "sdk_initializing"
                    ? "Initializing..."
                    : "Initialize Nexus"}
              </button>

              {/* STEP 3: Execute Bridge */}
              <button
                onClick={handleExecuteBridge}
                disabled={!isVerified || !sdkInitialized || flowState === "bridging" || flowState === "success"}
                className="glass-btn h-10 text-sm font-semibold transition-all hover:scale-105 sm:col-span-1"
                aria-label="Execute bridge"
              >
                {flowState === "success" ? "✓ Complete" : flowState === "bridging" ? "Executing..." : "Execute Bridge"}
              </button>
            </div>
          )}

          {/* Powered by Avail Footer */}
          <div className="mt-auto pt-1.5 pb-0 border-t border-base-content/5">
            <p className="text-[10px] text-base-content/50 text-center">
              Powered by{" "}
              <a
                href="https://availproject.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-base-content/70 hover:text-base-content/90 font-medium transition-colors"
              >
                Avail
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
