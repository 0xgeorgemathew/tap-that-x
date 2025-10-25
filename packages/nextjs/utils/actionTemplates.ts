import { encodeFunctionData } from "viem";

/**
 * Action templates for building callData for common DeFi operations
 */

export interface ActionTemplate {
  id: string;
  name: string;
  description: string;
  category: "payment" | "defi" | "bridge" | "custom";
  buildCallData: (params: any) => { target: `0x${string}`; callData: `0x${string}` };
}

// ERC20 ABI for common functions
const ERC20_ABI = [
  {
    name: "transferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// Uniswap V2 Router ABI (simplified)
const UNISWAP_V2_ROUTER_ABI = [
  {
    name: "swapExactTokensForTokens",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "amounts", type: "uint256[]" }],
  },
] as const;

/**
 * USDC Transfer Template
 * Transfers USDC from owner to recipient using transferFrom
 */
export const usdcTransferTemplate: ActionTemplate = {
  id: "usdc-transfer",
  name: "USDC Transfer",
  description: "Send USDC to a recipient",
  category: "payment",
  buildCallData: (params: { tokenAddress: `0x${string}`; from: `0x${string}`; to: `0x${string}`; amount: bigint }) => {
    const callData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transferFrom",
      args: [params.from, params.to, params.amount],
    });

    return {
      target: params.tokenAddress,
      callData,
    };
  },
};

/**
 * Generic ERC20 Transfer Template
 * Works with any ERC20 token
 */
export const erc20TransferTemplate: ActionTemplate = {
  id: "erc20-transfer",
  name: "ERC20 Transfer",
  description: "Send any ERC20 token to a recipient",
  category: "payment",
  buildCallData: (params: { tokenAddress: `0x${string}`; from: `0x${string}`; to: `0x${string}`; amount: bigint }) => {
    const callData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transferFrom",
      args: [params.from, params.to, params.amount],
    });

    return {
      target: params.tokenAddress,
      callData,
    };
  },
};

/**
 * Uniswap Token Swap Template
 * Swap tokens on Uniswap V2
 */
export const uniswapSwapTemplate: ActionTemplate = {
  id: "uniswap-swap",
  name: "Uniswap Token Swap",
  description: "Swap tokens on Uniswap",
  category: "defi",
  buildCallData: (params: {
    routerAddress: `0x${string}`;
    amountIn: bigint;
    amountOutMin: bigint;
    path: `0x${string}`[];
    to: `0x${string}`;
    deadline: bigint;
  }) => {
    const callData = encodeFunctionData({
      abi: UNISWAP_V2_ROUTER_ABI,
      functionName: "swapExactTokensForTokens",
      args: [params.amountIn, params.amountOutMin, params.path, params.to, params.deadline],
    });

    return {
      target: params.routerAddress,
      callData,
    };
  },
};

/**
 * Avail Nexus ETH Bridge Template
 * Bridges ETH from one chain to another using Avail Nexus
 * Uses target = 0x0 as a special marker to trigger push notification flow
 */
export const availBridgeTemplate: ActionTemplate = {
  id: "avail-bridge",
  name: "Bridge ETH",
  description: "Bridge ETH to another chain via Avail Nexus",
  category: "bridge",
  buildCallData: (params: { sourceChainId: number; destChainId: number; amount: bigint }) => {
    // Encode bridge parameters as callData
    const callData = encodeFunctionData({
      abi: [
        {
          name: "bridgeETH",
          type: "function",
          stateMutability: "payable",
          inputs: [
            { name: "sourceChainId", type: "uint256" },
            { name: "destChainId", type: "uint256" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [],
        },
      ],
      functionName: "bridgeETH",
      args: [BigInt(params.sourceChainId), BigInt(params.destChainId), params.amount],
    });

    // Return target as 0x1 (special marker for bridge actions)
    // This signals the relay to create a push notification instead of executing directly
    return {
      target: "0x0000000000000000000000000000000000000001",
      callData,
    };
  },
};

/**
 * Custom Action Template
 * For advanced users to input their own callData
 */
export const customActionTemplate: ActionTemplate = {
  id: "custom",
  name: "Custom Action",
  description: "Custom contract interaction (advanced)",
  category: "custom",
  buildCallData: (params: { target: `0x${string}`; callData: `0x${string}` }) => {
    return {
      target: params.target,
      callData: params.callData,
    };
  },
};

/**
 * All available action templates
 */
export const actionTemplates: ActionTemplate[] = [
  usdcTransferTemplate,
  erc20TransferTemplate,
  uniswapSwapTemplate,
  availBridgeTemplate,
  customActionTemplate,
];

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): ActionTemplate | undefined {
  return actionTemplates.find(t => t.id === id);
}

/**
 * Format token amount with decimals
 * Example: formatTokenAmount("100", 6) => 100000000n (100 USDC with 6 decimals)
 */
export function formatTokenAmount(amount: string, decimals: number): bigint {
  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

/**
 * Parse token amount to human-readable
 * Example: parseTokenAmount(100000000n, 6) => "100.00"
 */
export function parseTokenAmount(amount: bigint, decimals: number): string {
  const amountStr = amount.toString().padStart(decimals + 1, "0");
  const whole = amountStr.slice(0, -decimals) || "0";
  const fraction = amountStr.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

/**
 * Check if target address is the bridge marker (0x1)
 */
export function isBridgeAction(target: string): boolean {
  return target.toLowerCase() === "0x0000000000000000000000000000000000000001";
}

/**
 * Parse bridge callData to extract parameters
 * Returns sourceChainId, destChainId, and amount
 */
export function parseBridgeCallData(callData: `0x${string}`): {
  sourceChainId: number;
  destChainId: number;
  amount: bigint;
} | null {
  try {
    // Remove 0x prefix and function selector (first 4 bytes = 8 hex chars)
    const data = callData.slice(10);

    // Each parameter is 32 bytes (64 hex chars)
    const sourceChainId = parseInt(data.slice(0, 64), 16);
    const destChainId = parseInt(data.slice(64, 128), 16);
    const amount = BigInt("0x" + data.slice(128, 192));

    return { sourceChainId, destChainId, amount };
  } catch (error) {
    console.error("Failed to parse bridge callData:", error);
    return null;
  }
}
