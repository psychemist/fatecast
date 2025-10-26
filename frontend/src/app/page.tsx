'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { ContractStats } from '@/components/ContractStats';
import { EventList } from '@/components/EventList';
import { UserPositions } from '@/components/UserPositions';
import { ActivityFeed } from '@/components/ActivityFeed';
import { useFarcaster } from '@/components/FarcasterProvider';
import { useAccount } from 'wagmi';

export default function Home() {
  const { isConnected } = useAccount();
  const { isSDKLoaded, context } = useFarcaster();
  const [activeTab, setActiveTab] = useState<'markets' | 'positions'>('markets');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Predict the Future, Earn Rewards
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Decentralized prediction markets powered by PYUSD and Pyth Oracle.
            Place your bets, prove your predictions, and claim your winnings.
          </p>
          
          {/* Farcaster Badge */}
          {isSDKLoaded && context && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
              Running in Farcaster
              {context.user && ` • @${context.user.username || 'user'}`}
            </div>
          )}
        </div>

        {/* Contract Stats */}
        <ContractStats />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Markets/Positions */}
          <div className="lg:col-span-2">
            {isConnected && (
              <div className="bg-white border border-gray-200 rounded-lg p-1 mb-6 inline-flex">
                <button
                  onClick={() => setActiveTab('markets')}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    activeTab === 'markets'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Markets
                </button>
                <button
                  onClick={() => setActiveTab('positions')}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    activeTab === 'positions'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  My Positions
                </button>
              </div>
            )}

            {activeTab === 'markets' && <EventList />}
            {activeTab === 'positions' && isConnected && <UserPositions />}
          </div>

          {/* Right Column - Activity Feed */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Live Activity
              </h3>
              <ActivityFeed />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-600 text-sm">
              © 2025 Fatecast. Powered by Pyth Oracle & PYUSD.
            </div>
            <div className="flex gap-6">
              <a
                href="https://eth-sepolia.blockscout.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-600 text-sm transition-colors"
              >
                Blockscout Explorer
              </a>
              <a
                href="https://pyth.network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-600 text-sm transition-colors"
              >
                Pyth Network
              </a>
              {isSDKLoaded && (
                <a
                  href="https://www.farcaster.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-purple-600 text-sm transition-colors"
                >
                  Farcaster
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
