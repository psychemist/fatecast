'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useNotification } from '@blockscout/app-sdk';
import { PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI } from '@/config/contracts';
import { useEffect } from 'react';

/**
 * Hook for reading contract data
 */
export function useReadPredictionMarket<T = unknown>(
  functionName: string,
  args?: unknown[]
) {
  return useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName,
    args,
  }) as { data: T; isLoading: boolean; error: Error | null; refetch: () => void };
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
      functionName,
      args,
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
