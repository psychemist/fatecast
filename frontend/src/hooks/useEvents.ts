'use client';

import { useEffect, useState } from 'react';
import { useReadPredictionMarket } from './useContract';
import { getContractLogs } from '@/lib/blockscout';
import { PREDICTION_MARKET_ADDRESS } from '@/config/contracts';
import { ethers } from 'ethers';

export interface Event {
  id: bigint;
  question: string;
  pythFeedId: string;
  targetPrice: bigint;
  deadline: bigint;
  totalYes: bigint;
  totalNo: bigint;
  totalPool: bigint;
  resolved: boolean;
  outcome: boolean;
  creator: string;
  createdAt: bigint;
}

/**
 * Hook to fetch all active events
 */
export function useActiveEvents() {
  const { data: eventIds, isLoading, refetch } = useReadPredictionMarket<bigint[]>(
    'getActiveEvents'
  );

  return {
    eventIds: eventIds || [],
    isLoading,
    refetch,
  };
}

/**
 * Hook to fetch a single event by ID
 */
export function useEvent(eventId: bigint | undefined) {
  const { data, isLoading, refetch } = useReadPredictionMarket<Event>(
    'getEvent',
    eventId !== undefined ? [eventId] : undefined
  );

  return {
    event: data,
    isLoading,
    refetch,
  };
}

/**
 * Hook to fetch event counter
 */
export function useEventCounter() {
  const { data, isLoading } = useReadPredictionMarket<bigint>('eventCounter');

  return {
    count: data || BigInt(0),
    isLoading,
  };
}

/**
 * Hook to fetch recent event activities from Blockscout logs
 */
export function useEventActivities(limit = 10) {
  const [activities, setActivities] = useState<Array<{
    type: 'created' | 'bet' | 'resolved' | 'claimed';
    eventId: string;
    user?: string;
    amount?: string;
    prediction?: boolean;
    txHash: string;
    timestamp: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const logs = await getContractLogs(PREDICTION_MARKET_ADDRESS, 0, 'latest');
        
        const eventInterface = new ethers.Interface([
          'event EventCreated(uint256 indexed eventId, string question, bytes32 pythFeedId, int64 targetPrice, uint256 deadline, address indexed creator)',
          'event EnteredMarket(uint256 indexed eventId, address indexed user, bool prediction, uint256 amount)',
          'event EventResolved(uint256 indexed eventId, bool outcome, int64 finalPrice)',
          'event WinningsClaimed(uint256 indexed eventId, address indexed user, uint256 amount)',
        ]);

        const parsedActivities = logs
          .map((log) => {
            try {
              const parsed = eventInterface.parseLog({
                topics: log.topics as string[],
                data: log.data,
              });

              if (!parsed) return null;

              const eventId = parsed.args[0].toString();
              const txHash = log.transactionHash;

              if (parsed.name === 'EventCreated') {
                return {
                  type: 'created' as const,
                  eventId,
                  user: parsed.args[5], // creator
                  txHash,
                  timestamp: Date.now(),
                };
              } else if (parsed.name === 'EnteredMarket') {
                return {
                  type: 'bet' as const,
                  eventId,
                  user: parsed.args[1],
                  prediction: parsed.args[2],
                  amount: ethers.formatUnits(parsed.args[3], 6), // PYUSD has 6 decimals
                  txHash,
                  timestamp: Date.now(),
                };
              } else if (parsed.name === 'EventResolved') {
                return {
                  type: 'resolved' as const,
                  eventId,
                  txHash,
                  timestamp: Date.now(),
                };
              } else if (parsed.name === 'WinningsClaimed') {
                return {
                  type: 'claimed' as const,
                  eventId,
                  user: parsed.args[1],
                  amount: ethers.formatUnits(parsed.args[2], 6),
                  txHash,
                  timestamp: Date.now(),
                };
              }

              return null;
            } catch {
              return null;
            }
          })
          .filter((activity): activity is NonNullable<typeof activity> => activity !== null)
          .slice(-limit)
          .reverse();

        setActivities(parsedActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, [limit]);

  return {
    activities,
    isLoading,
  };
}
