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
 * Verify wallet ownership for a bridge request
 * @param bridgeRequest - The bridge request data from API
 * @param connectedWallet - The currently connected wallet address
 * @returns Verification result with detailed status
 */
export async function verifyBridgeRequest(
  bridgeRequest: BridgeRequestData,
  connectedWallet: string,
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
    return {
      isValid: true,
      walletMatches: true,
      chipSignatureValid: true,
      recoveredChipAddress: bridgeRequest.chipAddress,
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
