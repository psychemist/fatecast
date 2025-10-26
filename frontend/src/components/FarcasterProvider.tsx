'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

type MiniAppContext = Awaited<typeof sdk.context>;

interface FarcasterContextType {
  isSDKLoaded: boolean;
  context: MiniAppContext | null;
}

const FarcasterContext = createContext<FarcasterContextType>({
  isSDKLoaded: false,
  context: null,
});

export function useFarcaster() {
  return useContext(FarcasterContext);
}

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<MiniAppContext | null>(null);

  useEffect(() => {
    const initSDK = async () => {
      try {
        // Check if we're in a Farcaster environment
        if (typeof window !== 'undefined') {
          // Call ready() to hide the splash screen and display content
          await sdk.actions.ready();
          
          // Get context (it's a promise in the SDK)
          const farcasterContext = await sdk.context;
          setContext(farcasterContext);
          setIsSDKLoaded(true);
          
          console.log('Farcaster SDK initialized:', {
            user: farcasterContext.user,
            location: farcasterContext.location,
            client: farcasterContext.client,
          });
        }
      } catch (error) {
        // Not in a Farcaster environment or SDK failed to load
        console.log('Not running in Farcaster environment or SDK failed:', error);
        setIsSDKLoaded(false);
      }
    };

    initSDK();
  }, []);

  return (
    <FarcasterContext.Provider value={{ isSDKLoaded, context }}>
      {children}
    </FarcasterContext.Provider>
  );
}
