import { recoverTypedDataAddress } from "viem";

/**
 * Bridge request data structure matching the database schema
 */
export interface BridgeRequestData {
  requestId: string;
  userAddress: string;
  chipAddress: string;
  sourceChain: number;
  destChain: number;
  tokenAddress: string;
  amount: string;
  callData?: string;
  chipSignature?: string;
  timestamp?: number;
  nonce?: string;
  createdAt: string;
  expiresAt: string;
}

/**
 * Verification result
 */
export interface VerificationResult {
  isValid: boolean;
  walletMatches: boolean;
  chipSignatureValid: boolean;
  recoveredChipAddress?: string;
  error?: string;
}

/**
 * Recover chip address from the CallAuthorization signature
 * This proves the physical chip was tapped because only the chip can produce this signature
 */
async function recoverChipAddressFromSignature(
  bridgeRequest: BridgeRequestData,
  protocolAddress: string,
): Promise<{ address: string | null; error?: string }> {
  if (!bridgeRequest.chipSignature) {
    return { address: null, error: "No chip signature provided" };
  }

  try {
    const domain = {
      name: "TapThatXProtocol",
      version: "1",
      verifyingContract: protocolAddress as `0x${string}`,
    };

    const types = {
      CallAuthorization: [
        { name: "owner", type: "address" },
        { name: "target", type: "address" },
        { name: "callData", type: "bytes" },
        { name: "value", type: "uint256" },
        { name: "timestamp", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    };
    if (!bridgeRequest.callData) {
      return {
        address: null,
        error: "Original callData not found in bridge request. Cannot verify signature.",
      };
    }

    const bridgeCallData = bridgeRequest.callData as `0x${string}`;

    const message = {
      owner: bridgeRequest.userAddress as `0x${string}`,
      target: "0x0000000000000000000000000000000000000001" as `0x${string}`,
      callData: bridgeCallData as `0x${string}`,
      value: 0n,
      timestamp: BigInt(bridgeRequest.timestamp || 0),
      nonce: bridgeRequest.nonce as `0x${string}`,
    };

    // Recover the address that signed this typed data
    const recoveredAddress = await recoverTypedDataAddress({
      domain,
      types,
      primaryType: "CallAuthorization",
      message,
      signature: bridgeRequest.chipSignature as `0x${string}`,
    });

    return { address: recoveredAddress };
  } catch (error) {
    console.error("Failed to recover chip address from signature:", error);
    return {
      address: null,
      error: `Signature recovery failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Verify wallet ownership and chip signature for a bridge request
 * @param bridgeRequest - The bridge request data from API
 * @param connectedWallet - The currently connected wallet address
 * @param protocolAddress - Address of TapThatXProtocol contract for signature verification
 * @returns Verification result with detailed status
 */
export async function verifyBridgeRequest(
  bridgeRequest: BridgeRequestData,
  connectedWallet: string,
  protocolAddress: string,
): Promise<VerificationResult> {
  try {
    // Step 1: Verify connected wallet matches original user
    const walletMatches = connectedWallet.toLowerCase() === bridgeRequest.userAddress.toLowerCase();

    if (!walletMatches) {
      return {
        isValid: false,
        walletMatches: false,
        chipSignatureValid: false,
        error: `Wallet mismatch. Expected ${bridgeRequest.userAddress}, got ${connectedWallet}`,
      };
    }

    // Step 2: Recover chip address from signature
    const { address: recoveredAddress, error: recoveryError } = await recoverChipAddressFromSignature(
      bridgeRequest,
      protocolAddress,
    );

    if (!recoveredAddress || recoveryError) {
      return {
        isValid: false,
        walletMatches: true,
        chipSignatureValid: false,
        error: recoveryError || "Failed to recover chip address",
      };
    }

    // Step 3: Verify recovered address matches expected chip address
    const chipMatches = recoveredAddress.toLowerCase() === bridgeRequest.chipAddress.toLowerCase();

    if (!chipMatches) {
      return {
        isValid: false,
        walletMatches: true,
        chipSignatureValid: false,
        recoveredChipAddress: recoveredAddress,
        error: `Chip verification failed. Expected ${bridgeRequest.chipAddress}, recovered ${recoveredAddress}`,
      };
    }

    // All checks passed!
    return {
      isValid: true,
      walletMatches: true,
      chipSignatureValid: true,
      recoveredChipAddress: recoveredAddress,
    };
  } catch (error) {
    return {
      isValid: false,
      walletMatches: false,
      chipSignatureValid: false,
      error: error instanceof Error ? error.message : "Verification failed",
    };
  }
}
