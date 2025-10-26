'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useReadPredictionMarket } from './useContract';
import { getContractLogs } from '@/lib/blockscout';
import { PREDICTION_MARKET_ADDRESS } from '@/config/contracts';
import { ethers } from 'ethers';

export interface UserBet {
  eventId: bigint;
  amount: bigint;
  prediction: boolean;
}

/**
 * Hook to fetch user's bet on a specific event
 */
export function useUserBet(eventId: bigint | undefined) {
  const { address } = useAccount();
  
  const { data, isLoading, refetch } = useReadPredictionMarket<UserBet>(
    'getUserBet',
    address && eventId !== undefined ? [address, eventId] : undefined
  );

  return {
    bet: data,
    isLoading,
    refetch,
  };
}

/**
 * Hook to check if user has claimed winnings
 */
export function useHasClaimedWinnings(eventId: bigint | undefined) {
  const { address } = useAccount();
  
  const { data, isLoading } = useReadPredictionMarket<boolean>(
    'hasClaimedWinnings',
    address && eventId !== undefined ? [address, eventId] : undefined
  );

  return {
    hasClaimed: data || false,
    isLoading,
  };
}

/**
 * Hook to calculate potential winnings
 */
export function usePotentialWinnings(eventId: bigint | undefined) {
  const { address } = useAccount();
  
  const { data, isLoading } = useReadPredictionMarket<bigint>(
    'calculatePotentialWinnings',
    address && eventId !== undefined ? [eventId, address] : undefined
  );

  return {
    winnings: data || BigInt(0),
    isLoading,
  };
}

/**
 * Hook to fetch all user's betting history from Blockscout
 */
export function useUserBettingHistory() {
  const { address } = useAccount();
  const [history, setHistory] = useState<Array<{
    eventId: string;
    amount: string;
    prediction: boolean;
    txHash: string;
    timestamp: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const logs = await getContractLogs(PREDICTION_MARKET_ADDRESS, 0, 'latest');
        
        const eventInterface = new ethers.Interface([
          'event EnteredMarket(uint256 indexed eventId, address indexed user, bool prediction, uint256 amount)',
        ]);

        const userBets = logs
          .map((log) => {
            try {
              const parsed = eventInterface.parseLog({
                topics: log.topics as string[],
                data: log.data,
              });

              if (!parsed || parsed.name !== 'EnteredMarket') return null;

              // Check if this bet is from the current user
              const betUser = parsed.args[1].toLowerCase();
              if (betUser !== address.toLowerCase()) return null;

              return {
                eventId: parsed.args[0].toString(),
                amount: ethers.formatUnits(parsed.args[3], 6), // PYUSD has 6 decimals
                prediction: parsed.args[2],
                txHash: log.transactionHash,
                timestamp: Date.now(),
              };
            } catch {
              return null;
            }
          })
          .filter((bet): bet is NonNullable<typeof bet> => bet !== null)
          .reverse();

        setHistory(userBets);
      } catch (error) {
        console.error('Error fetching user betting history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, [address]);

  return {
    history,
    isLoading,
  };
}
