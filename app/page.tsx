'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WalletConnect from '@/components/WalletConnect';
import { WalletConnection } from '@/lib/wallet';

export default function Home() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletConnection | null>(null);

  const handleWalletConnect = (walletConnection: WalletConnection) => {
    setWallet(walletConnection);
    // Store in session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('walletAddress', walletConnection.address);
    }
    // Redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <WalletConnect onConnect={handleWalletConnect} />

      <footer className="bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-400">
            © 2025 Vroomberg. Powered by Octav API, Claude AI & Hyperliquid.
          </p>
        </div>
      </footer>
    </main>
  );
}
