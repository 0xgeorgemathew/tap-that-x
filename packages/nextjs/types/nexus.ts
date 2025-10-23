// TypeScript types for Avail Nexus SDK responses (actual format from SDK)

// Supported tokens in the Nexus SDK
export type SUPPORTED_TOKENS = "ETH" | "USDC" | "USDT";

export interface ChainInfo {
  id: number;
  logo: string;
  name: string;
}

export interface BalanceBreakdown {
  balance: string;
  balanceInFiat: number;
  chain: ChainInfo;
  contractAddress: string;
  decimals: number;
  universe: number;
}

export interface TokenBalance {
  abstracted: boolean;
  balance: string;
  balanceInFiat: number;
  breakdown: BalanceBreakdown[];
  decimals: number;
  icon: string;
  symbol: string;
}

// SDK returns an array of TokenBalance
export type UnifiedBalances = TokenBalance[];

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

export interface ChainMetadata {
  name: string;
  displayName: string;
  logoUrl: string;
  nativeToken: string;
  explorerUrl: string;
}

export interface BalanceSummary {
  totalChains: number;
  totalTokens: number;
  totalValueUSD: number;
  balancesByChain: Map<string, ParsedBalance[]>;
  balancesByToken: Map<string, ParsedBalance[]>;
}

export type TransferStatus = "pending" | "in_progress" | "completed" | "failed";

export interface Transfer {
  transferId: string;
  fromChain: string;
  toChain: string;
  token: string;
  amount: string;
  recipient: string;
  status: TransferStatus;
  txHash?: string;
  estimatedTime?: number;
  createdAt: number;
}

// Bridge-related types
export interface BridgeParams {
  token: SUPPORTED_TOKENS;
  amount: number | string;
  chainId: number;
  gas?: bigint;
  sourceChains?: number[];
}

export interface BridgeResultSuccess {
  success: true;
  explorerUrl: string;
  transactionHash?: string;
}

export interface BridgeResultFailure {
  success: false;
  error: string;
}

export type BridgeResult = BridgeResultSuccess | BridgeResultFailure;

export interface SimulationResult {
  estimatedGas?: string;
  estimatedTime?: string;
  totalCost?: string;
  route?: {
    sourceChain: string;
    destinationChain: string;
    token: string;
    amount: string;
  };
}
