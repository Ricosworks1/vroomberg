'use client';

import { useState } from 'react';
import { connectWallet, shortenAddress, WalletConnection } from '@/lib/wallet';

interface WalletConnectProps {
  onConnect: (wallet: WalletConnection) => void;
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    try {
      const wallet = await connectWallet();
      onConnect(wallet);
    } catch (err: any) {
      // Handle different error types with user-friendly messages
      let errorMessage = 'Failed to connect wallet';

      // User rejected the connection request
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        errorMessage = 'Connection cancelled. Please approve the connection request to continue.';
      }
      // MetaMask not installed
      else if (err.message?.includes('MetaMask not installed')) {
        errorMessage = 'MetaMask not detected. Please install MetaMask browser extension.';
      }
      // Network switch failed
      else if (err.message?.includes('network') || err.message?.includes('chain')) {
        errorMessage = 'Failed to switch to Arbitrum network. Please try again.';
      }
      // Generic error - use cleaned message
      else if (err.message) {
        // Clean up technical error messages
        const cleanMessage = err.message
          .replace(/ethers-user-denied:\s*/i, '')
          .replace(/user rejected the request\.?/i, 'Connection cancelled')
          .replace(/action=".*?"/gi, '')
          .replace(/reason=".*?"/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
        errorMessage = cleanMessage;
      }

      // Only log detailed errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Wallet connection error:', err);
      }

      setError(errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          VROOMBERG
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Autonomous AI Trading for DeFi
        </p>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-8 mb-6">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto mb-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Connect to Arbitrum network to start autonomous trading
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {connecting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </span>
            ) : (
              'Connect MetaMask'
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
          <p>✓ No signup required</p>
          <p>✓ Your keys, your control</p>
          <p>✓ Powered by AI & Octav API</p>
        </div>
      </div>
    </div>
  );
}
