/**
 * Chain helper utilities
 * Client-safe utilities that can be used in both client and server components
 */

/**
 * Get chain name from chain ID
 * @param chainId Chain ID number
 * @returns Human-readable chain name
 */
export function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    // Mainnets
    1: "Ethereum",
    10: "Optimism",
    137: "Polygon",
    8453: "Base",
    42161: "Arbitrum",
    // Testnets
    11155111: "Sepolia",
    84532: "Base Sepolia",
    11155420: "OP Sepolia",
    421614: "Arbitrum Sepolia",
    80002: "Polygon Amoy",
  };

  return chainNames[chainId] || `Chain ${chainId}`;
}
