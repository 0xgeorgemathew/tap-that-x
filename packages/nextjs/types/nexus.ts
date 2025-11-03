// SDK type for unified balances
export interface UnifiedBalance {
  abstracted?: boolean;
  balance: string;
  balanceInFiat: number;
  breakdown: {
    balance: string;
    balanceInFiat: number;
    chain: {
      id: number;
      logo: string;
      name: string;
    };
    contractAddress: `0x${string}`;
    decimals: number;
    isNative?: boolean;
    universe: number;
  }[];
  decimals: number;
  icon?: string;
  symbol: string;
}

// Array of unified balances returned by SDK
export type UnifiedBalances = UnifiedBalance[];

// Parsed balance for UI display
export interface ParsedBalance {
  chain: string;
  chainId: number;
  chainLogo: string;
  token: string;
  tokenIcon: string;
  balance: string;
  balanceFormatted: string;
  balanceInFiat: number;
  contractAddress: string;
  decimals: number;
}
