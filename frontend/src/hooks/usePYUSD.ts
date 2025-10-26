'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useNotification } from '@blockscout/app-sdk';
import { PYUSD_ADDRESS, PYUSD_ABI } from '@/config/contracts';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

/**
 * Hook to get PYUSD balance
 */
export function usePYUSDBalance() {
  const { address } = useAccount();
  
  // Ensure we target the Sepolia chain and re-run when args / account change
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);

  const { data, isLoading, refetch } = useReadContract({
    address: PYUSD_ADDRESS,
    abi: PYUSD_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId,
    query: {
      enabled: !!address,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: Infinity,
    },
  });

  // Normalize returned value to bigint
  const balance = data ? BigInt(String(data)) : BigInt(0);

  return {
    balance,
    isLoading,
    refetch,
  };
}

/**
 * Hook to check PYUSD allowance
 */
export function usePYUSDAllowance(spender: `0x${string}`) {
  const { address } = useAccount();
  
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);

  const { data, isLoading, refetch } = useReadContract({
    address: PYUSD_ADDRESS,
    abi: PYUSD_ABI,
    functionName: 'allowance',
    args: address ? [address, spender] : undefined,
    chainId,
    query: {
      enabled: !!address,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: Infinity,
    },
  });

  const allowance = data ? BigInt(String(data)) : BigInt(0);

  return {
    allowance,
    isLoading,
    refetch,
  };
}

/**
 * Hook to approve PYUSD spending
 */
export function useApprovePYUSD() {
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

  const approve = (spender: `0x${string}`, amount: bigint) => {
    writeContract({
      address: PYUSD_ADDRESS,
      abi: PYUSD_ABI,
      functionName: 'approve',
      args: [spender, amount],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
