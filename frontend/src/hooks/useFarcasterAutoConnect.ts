'use client';

import { useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { useFarcaster } from '@/components/FarcasterProvider';

/**
 * Hook that automatically connects to Farcaster wallet when in Farcaster environment
 */
export function useFarcasterAutoConnect() {
  const { isSDKLoaded } = useFarcaster();
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    // Only auto-connect if in Farcaster environment and not already connected
    if (isSDKLoaded && !isConnected) {
      // Try to find and use Farcaster connector if available
      const farcasterConnector = connectors.find(
        (connector) => connector.id === 'farcasterMiniApp'
      );
      
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    }
  }, [isSDKLoaded, isConnected, connect, connectors]);
}
