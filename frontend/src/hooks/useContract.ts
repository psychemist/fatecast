'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useNotification } from '@blockscout/app-sdk';
import { PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI } from '@/config/contracts';
import { useEffect } from 'react';

/**
 * Hook for reading contract data
 */
export function useReadPredictionMarket<T = unknown>(
  functionName: "getActiveEvents" | "eventCounter" | "getEvent" | "getUserBet" | "calculatePotentialWinnings" | "hasClaimedWinnings" | "minBetAmount" | "maxBetAmount",
  args?: readonly unknown[]
): {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const result = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName,
    args: args as any,
    query: {
      enabled: args !== undefined || functionName === 'getActiveEvents' || functionName === 'eventCounter',
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: Infinity,
    },
  });

  return {
    data: result.data as T | undefined,
    isLoading: result.isPending || result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Hook for writing to contract with Blockscout transaction notifications
 */
export function useWritePredictionMarket() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { openTxToast } = useNotification();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Show transaction toast when hash is available
  useEffect(() => {
    if (hash) {
      // Sepolia chain ID is 11155111
      openTxToast('11155111', hash);
    }
  }, [hash, openTxToast]);

  const write = (functionName: string, args: unknown[]) => {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PREDICTION_MARKET_ABI,
      functionName: functionName as any,
      args: args as any,
    });
  };

  return {
    write,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
