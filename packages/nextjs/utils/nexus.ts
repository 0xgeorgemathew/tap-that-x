// Polyfill Buffer and process for browser environment
import { NexusSDK } from "@avail-project/nexus-core";
import { Buffer } from "buffer";
import process from "process";

if (typeof window !== "undefined") {
  (window as any).Buffer = Buffer;
  (window as any).process = process;
}

// Create global SDK instance
export const sdk = new NexusSDK({ network: "testnet" });

/**
 * Check if SDK is initialized
 */
export function isInitialized() {
  return sdk.isInitialized();
}

/**
 * Initialize SDK with provider (e.g., MetaMask)
 */
export async function initializeWithProvider(provider: any) {
  if (!provider) throw new Error("No EIP-1193 provider (e.g., MetaMask) found");

  // If already initialized, return
  if (sdk.isInitialized()) return;

  // Initialize with provider
  await sdk.initialize(provider);
}

/**
 * De-initialize SDK
 */
export async function deinit() {
  if (!sdk.isInitialized()) return;
  await sdk.deinit();
}

/**
 * Execute bridge transaction
 */
export async function executeBridge(params: {
  token: string;
  amount: number;
  chainId: number;
  sourceChains?: number[];
}) {
  if (!sdk.isInitialized()) {
    throw new Error("SDK not initialized. Please initialize first.");
  }

  return await sdk.bridge(params as any);
}

/**
 * Get unified balances across all supported chains
 */
export async function getUnifiedBalances() {
  if (!sdk.isInitialized()) {
    throw new Error("SDK not initialized. Please initialize first.");
  }

  return await sdk.getUnifiedBalances();
}
