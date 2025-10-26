'use client';

import { useReadPredictionMarket } from './useContract';

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
  const { data, isLoading, refetch, error } = useReadPredictionMarket<Event>(
    'getEvent',
    eventId !== undefined ? [eventId] : undefined
  );

  return {
    event: data,
    isLoading,
    refetch,
    error,
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
