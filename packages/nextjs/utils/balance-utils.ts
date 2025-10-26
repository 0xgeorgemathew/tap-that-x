// Utility functions for processing and formatting balance data
import { ParsedBalance, UnifiedBalances } from "~~/types/nexus";

/**
 * Format balance string to fixed decimal places
 * @param balance - Raw balance string
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted balance string
 */
export function formatBalance(balance: string, decimals: number = 4): string {
  const num = parseFloat(balance);
  if (isNaN(num)) return "0";

  // For very small numbers, use more precision
  if (num < 0.0001 && num > 0) {
    return num.toExponential(2);
  }

  return num.toFixed(decimals);
}

/**
 * Parse unified balances from Nexus SDK into structured array
 * @param unifiedBalances - Array of balances from SDK
 * @returns Array of parsed balances with chain breakdown
 */
export function parseUnifiedBalances(unifiedBalances: UnifiedBalances): ParsedBalance[] {
  const parsed: ParsedBalance[] = [];

  if (!Array.isArray(unifiedBalances)) {
    return parsed;
  }

  unifiedBalances.forEach(tokenBalance => {
    tokenBalance.breakdown.forEach(breakdown => {
      // Only include balances > 0
      if (parseFloat(breakdown.balance) > 0) {
        parsed.push({
          chain: breakdown.chain.name,
          chainId: breakdown.chain.id,
          chainLogo: breakdown.chain.logo,
          token: tokenBalance.symbol,
          tokenIcon: tokenBalance.icon || "",
          balance: breakdown.balance,
          balanceFormatted: formatBalance(breakdown.balance),
          balanceInFiat: breakdown.balanceInFiat,
          contractAddress: breakdown.contractAddress,
          decimals: breakdown.decimals,
        });
      }
    });
  });

  return parsed;
}

/**
 * Group balances by token
 * @param balances - Array of parsed balances
 * @returns Map of token symbol to balances
 */
export function groupByToken(balances: ParsedBalance[]): Map<string, ParsedBalance[]> {
  const grouped = new Map<string, ParsedBalance[]>();

  balances.forEach(balance => {
    const existing = grouped.get(balance.token) || [];
    grouped.set(balance.token, [...existing, balance]);
  });

  return grouped;
}

/**
 * Calculate total USD value of all balances
 * @param balances - Array of parsed balances
 * @returns Total USD value
 */
export function getTotalValueUSD(balances: ParsedBalance[]): number {
  return balances.reduce((sum, b) => sum + b.balanceInFiat, 0);
}

/**
 * Format USD value
 * @param value - USD value
 * @returns Formatted string
 */
export function formatUSD(value: number): string {
  if (value < 0.01 && value > 0) {
    return "< $0.01";
  }
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
