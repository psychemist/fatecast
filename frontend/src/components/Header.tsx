'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTransactionPopup } from '@blockscout/app-sdk';
import { usePYUSDBalance } from '@/hooks/usePYUSD';
import { ensureCorrectNetwork } from '@/lib/switchNetwork';
import { ethers } from 'ethers';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

export function Header() {
  const { openPopup } = useTransactionPopup();
  const { balance } = usePYUSDBalance();
  const { isConnected } = useAccount();

  // Ensure wallet uses our Alchemy RPC when connected
  useEffect(() => {
    if (isConnected) {
      ensureCorrectNetwork().catch(console.error);
    }
  }, [isConnected]);

  const handleViewTransactions = () => {
    openPopup({
      chainId: '11155111', // Sepolia
    });
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Fatecast
            </h1>
            <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              Sepolia
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* PYUSD Balance */}
            <div className="hidden sm:block">
              <div className="px-4 py-2 bg-gray-100 rounded-lg">
                <div className="text-xs text-gray-500">PYUSD Balance</div>
                <div className="font-semibold text-gray-900">
                  {ethers.formatUnits(balance, 6)} PYUSD
                </div>
              </div>
            </div>

            {/* Transaction History Button */}
            <button
              onClick={handleViewTransactions}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">History</span>
            </button>

            {/* Wallet Connect */}
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
