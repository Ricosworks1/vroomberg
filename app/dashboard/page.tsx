'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { shortenAddress } from '@/lib/wallet';
import TradingDashboard from '@/components/TradingDashboard';

// Type augmentation for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface PortfolioToken {
  token_address: string;
  token_symbol: string;
  token_name: string;
  balance: string;
  balance_usd: number;
  price_usd: number;
  chain: string;
  protocol?: string;
}

interface PortfolioData {
  wallet_address: string;
  total_balance_usd: number;
  tokens: PortfolioToken[];
  chains: string[];
  timestamp: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [hyperliquidBalance, setHyperliquidBalance] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if wallet is connected
    const address = sessionStorage.getItem('walletAddress');
    if (!address) {
      router.push('/');
      return;
    }
    setWalletAddress(address);
    fetchPortfolio(address);

    // Listen for MetaMask account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected in MetaMask
          handleDisconnect();
        } else if (accounts[0].toLowerCase() !== address.toLowerCase()) {
          // User switched to a different account
          sessionStorage.setItem('walletAddress', accounts[0]);
          setWalletAddress(accounts[0]);
          fetchPortfolio(accounts[0]);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [router]);

  const fetchPortfolio = async (address: string) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch both wallet balance and Hyperliquid balance in parallel
      const [portfolioResponse, hlResponse] = await Promise.all([
        fetch(`/api/portfolio?address=${address}`),
        fetch('/api/hyperliquid-balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        }),
      ]);

      if (!portfolioResponse.ok) {
        const errorData = await portfolioResponse.json();
        throw new Error(errorData.error || 'Failed to fetch portfolio');
      }

      const portfolioData = await portfolioResponse.json();
      setPortfolio(portfolioData);

      // Hyperliquid balance is optional - don't fail if it errors
      if (hlResponse.ok) {
        const hlData = await hlResponse.json();
        setHyperliquidBalance(hlData.hyperliquid_balance);
        console.log('[HYPERLIQUID] Balance loaded:', hlData.hyperliquid_balance);
      } else {
        console.warn('[HYPERLIQUID] Failed to fetch balance, continuing without it');
      }
    } catch (err: any) {
      console.error('Portfolio fetch error:', err);
      setError(err.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    // Clear session storage
    sessionStorage.removeItem('walletAddress');

    // Force page reload to clear all state and MetaMask connection
    window.location.href = '/';
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.000001) return num.toExponential(2);
    if (num < 1) return num.toFixed(6);
    return num.toLocaleString('en-US', { maximumFractionDigits: 6 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 dark:text-gray-300">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              VROOMBERG
            </h1>
            <div className="flex items-center gap-4">
              {walletAddress && (
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
                      {shortenAddress(walletAddress)}
                    </span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <h3 className="text-red-800 dark:text-red-300 font-semibold mb-2">Error Loading Portfolio</h3>
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <button
              onClick={() => walletAddress && fetchPortfolio(walletAddress)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : portfolio ? (
          <div className="space-y-6">
            {/* Portfolio Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Portfolio Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Wallet Balance</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(portfolio.total_balance_usd)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">On-chain tokens</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Tokens</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {portfolio.tokens.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Chains</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {portfolio.chains.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Hyperliquid Balance */}
            {hyperliquidBalance && hyperliquidBalance.account_value_usd > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl shadow-lg p-6 border-2 border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Hyperliquid Exchange Balance
                  </h2>
                  <a
                    href="https://app.hyperliquid.xyz/trade"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Open Hyperliquid →
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Account Value</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {formatCurrency(hyperliquidBalance.account_value_usd)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Available Balance</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {formatCurrency(hyperliquidBalance.available_balance_usd)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Margin Used</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {formatCurrency(hyperliquidBalance.margin_used_usd)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Open Positions</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {hyperliquidBalance.positions?.length || 0}
                    </p>
                  </div>
                </div>

                {/* Active Positions */}
                {hyperliquidBalance.positions && hyperliquidBalance.positions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                      Active Positions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {hyperliquidBalance.positions.map((pos: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-purple-200 dark:border-purple-700"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {pos.coin}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                pos.unrealized_pnl >= 0
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }`}
                            >
                              {pos.unrealized_pnl >= 0 ? '+' : ''}
                              {formatCurrency(pos.unrealized_pnl)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                            <div>Size: {pos.size > 0 ? 'LONG' : 'SHORT'} {Math.abs(pos.size).toFixed(4)}</div>
                            <div>Entry: ${pos.entry_price.toFixed(2)}</div>
                            <div>Leverage: {pos.leverage.toFixed(1)}x</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Token Holdings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Token Holdings</h2>
              </div>

              {portfolio.tokens.length === 0 ? (
                <div className="p-6 text-center text-slate-600 dark:text-slate-400">
                  No tokens found in this wallet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Token
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Chain
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Balance
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Value (USD)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {portfolio.tokens.map((token, index) => (
                        <tr key={`${token.token_address}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {token.token_symbol || 'Unknown'}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {token.token_name || shortenAddress(token.token_address)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">
                              {token.chain}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-sm text-slate-900 dark:text-slate-100">
                            {formatBalance(token.balance)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-sm text-slate-900 dark:text-slate-100">
                            {formatCurrency(token.price_usd)}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(token.balance_usd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* AI Trading Dashboard */}
            <TradingDashboard
              walletAddress={portfolio.wallet_address}
              totalBalance={portfolio.total_balance_usd}
              tokens={portfolio.tokens}
            />
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-400">
            © 2025 Vroomberg. Powered by Octav API, Claude AI & Hyperliquid.
          </p>
        </div>
      </footer>
    </div>
  );
}
