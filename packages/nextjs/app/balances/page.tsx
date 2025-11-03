"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronDown, Loader2, RefreshCw, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { UnifiedNavigation } from "~~/components/UnifiedNavigation";
import type { ParsedBalance, UnifiedBalances } from "~~/types/nexus";
import { formatUSD, getTotalValueUSD, groupByToken, parseUnifiedBalances } from "~~/utils/balance-utils";
import { getUnifiedBalances, initializeWithProvider, isInitialized } from "~~/utils/nexus";

export default function BalancesPage() {
  const { isConnected } = useAccount();
  const [isSdkInitialized, setIsSdkInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [balances, setBalances] = useState<UnifiedBalances | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Define fetch function first
  const handleFetchBalances = async () => {
    if (!isInitialized()) {
      setError("SDK not initialized. Please connect your wallet.");
      return;
    }

    setIsLoadingBalances(true);
    setError(null);

    try {
      const result = await getUnifiedBalances();
      setBalances(result as UnifiedBalances);
    } catch (err: any) {
      setError(err.message || "Failed to fetch balances");
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // Auto-initialize SDK when page loads or wallet connects
  useEffect(() => {
    const initializeAndFetch = async () => {
      // Skip if not connected
      if (!isConnected) return;

      // Check if already initialized
      if (isInitialized()) {
        // SDK already initialized, just fetch balances
        setIsSdkInitialized(true);
        await handleFetchBalances();
        return;
      }

      // Initialize SDK
      setIsInitializing(true);
      setError(null);

      try {
        if (typeof window.ethereum === "undefined") {
          setError("MetaMask not found. Please install MetaMask extension.");
          return;
        }

        await initializeWithProvider(window.ethereum);
        setIsSdkInitialized(true);

        // Fetch balances after initialization
        await handleFetchBalances();
      } catch (err: any) {
        setError(err.message || "Failed to initialize Nexus SDK");
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAndFetch();
  }, [isConnected]);

  const parsedBalances = useMemo(() => {
    if (!balances) return [];
    return parseUnifiedBalances(balances);
  }, [balances]);

  const balancesByToken = useMemo(() => groupByToken(parsedBalances), [parsedBalances]);
  const totalValueUSD = useMemo(() => getTotalValueUSD(parsedBalances), [parsedBalances]);

  const toggleExpanded = (key: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-6 pb-24">
        <div className="w-full max-w-md mx-auto">
          <div className="glass-card p-8 flex flex-col items-center text-center">
            <Wallet className="h-16 w-16 text-base-content/30 mb-4" />
            <h1 className="text-2xl font-bold text-base-content mb-2">Unified Balances</h1>
            <p className="text-base-content/70 mb-6">Connect your wallet to view your cross-chain balances</p>
          </div>
        </div>
        <UnifiedNavigation />
      </div>
    );
  }

  // Main balances view
  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-6 pb-24 relative">
      {/* Initializing Overlay */}
      {isInitializing && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="glass-card p-8 max-w-md mx-4 flex flex-col items-center text-center">
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
              <h2 className="text-2xl font-bold text-base-content mb-2">Initializing...</h2>
              <p className="text-base-content/70">Please confirm in your wallet to enable Nexus</p>
            </div>
          </div>
        </>
      )}

      <div className="w-full max-w-md mx-auto">
        <div className="glass-card p-6">
          {/* Header - Refresh Button Only */}
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={handleFetchBalances}
              disabled={isLoadingBalances || !isSdkInitialized}
              className="p-2 rounded-lg hover:bg-base-content/10 transition-colors disabled:opacity-50"
              aria-label="Refresh balances"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingBalances ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Total Balance Value - Centered */}
          <div className="text-center mb-6">
            <p className="text-sm text-base-content/60 mb-2">Total Unified Balance</p>
            <p className="text-4xl font-bold text-success tabular-nums">
              {balances ? formatUSD(totalValueUSD) : "$0.00"}
            </p>
          </div>

          {/* Loading State */}
          {isLoadingBalances && !balances && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-base-content/70">Loading balances...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoadingBalances && !balances && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-error mb-4" />
              <p className="text-error text-center mb-4">{error}</p>
              <button onClick={handleFetchBalances} className="glass-btn px-6 py-2">
                Try Again
              </button>
            </div>
          )}

          {/* Balances Display */}
          {!isLoadingBalances && balances && (
            <>
              {/* Empty State */}
              {parsedBalances.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Wallet className="h-12 w-12 text-base-content/30 mb-4" />
                  <p className="text-base-content/70 text-center">No balances found</p>
                </div>
              )}

              {/* Balance List - Accordion Style */}
              {parsedBalances.length > 0 && (
                <div className="space-y-3">
                  {Array.from(balancesByToken.entries()).map(([token, tokenBalances]) => (
                    <TokenAccordion
                      key={token}
                      token={token}
                      balances={tokenBalances}
                      isExpanded={expandedItems.has(token)}
                      onToggle={() => toggleExpanded(token)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-base-content/10">
            <p className="text-xs text-base-content/50 text-center">
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
      <UnifiedNavigation />
    </div>
  );
}

// Token Accordion Component
function TokenAccordion({
  token,
  balances,
  isExpanded,
  onToggle,
}: {
  token: string;
  balances: ParsedBalance[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const total = balances.reduce((sum, b) => sum + parseFloat(b.balance), 0);
  const totalValue = balances.reduce((sum, b) => sum + b.balanceInFiat, 0);

  return (
    <div className="relative overflow-hidden transition-all rounded-2xl border border-base-content/20 bg-base-200/50 backdrop-blur-sm">
      {/* Accordion Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-base-content/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {balances[0].tokenIcon && (
            <div className="w-10 h-10 rounded-full bg-base-content/10 flex items-center justify-center flex-shrink-0">
              <img src={balances[0].tokenIcon} alt={token} className="w-6 h-6 rounded-full" />
            </div>
          )}
          <div className="text-left min-w-0">
            <h3 className="text-sm font-bold text-base-content">{token}</h3>
            <p className="text-xs text-base-content/60 mt-0.5 font-medium">{formatUSD(totalValue)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-lg font-bold text-base-content font-mono tabular-nums">
              {total < 0.01 && total > 0 ? total.toExponential(2) : total.toFixed(2)}
            </p>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-base-content/50 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Accordion Content - Expandable */}
      {isExpanded && (
        <div className="border-t border-base-content/10 bg-base-content/5">
          {balances.map((balance, idx) => (
            <div
              key={`${token}-${balance.chain}-${idx}`}
              className="flex items-center justify-between px-4 py-3 border-b border-base-content/5 last:border-b-0 hover:bg-base-content/10 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {balance.chainLogo && (
                  <img src={balance.chainLogo} alt={balance.chain} className="w-5 h-5 rounded-full flex-shrink-0" />
                )}
                <span className="text-xs font-medium text-base-content/80 truncate">{balance.chain}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-base-content font-mono font-semibold tabular-nums">
                  {balance.balanceFormatted}
                </p>
                <p className="text-xs text-base-content/60 mt-0.5 font-medium">{formatUSD(balance.balanceInFiat)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
