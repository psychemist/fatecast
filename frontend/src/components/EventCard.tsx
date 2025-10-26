'use client';

import { useEvent } from '@/hooks/useEvents';
import { formatDistanceToNow } from '@/lib/utils';
import { getTxUrl } from '@/lib/blockscout';
import { ethers } from 'ethers';

interface EventCardProps {
  eventId: bigint;
  onBetClick?: (eventId: bigint) => void;
}

export function EventCard({ eventId, onBetClick }: EventCardProps) {
  const { event, isLoading } = useEvent(eventId);

  if (isLoading || !event) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  const totalYes = Number(ethers.formatUnits(event.totalYes, 6));
  const totalNo = Number(ethers.formatUnits(event.totalNo, 6));
  const totalPool = Number(ethers.formatUnits(event.totalPool, 6));
  
  const yesPercentage = totalPool > 0 ? (totalYes / totalPool) * 100 : 50;
  const noPercentage = totalPool > 0 ? (totalNo / totalPool) * 100 : 50;

  const deadline = new Date(Number(event.deadline) * 1000);
  const isExpired = deadline < new Date();
  
  const timeRemaining = isExpired ? 'Expired' : formatDistanceToNow(deadline);

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      {/* Question */}
      <h3 className="text-xl font-semibold mb-4 text-gray-900">
        {event.question}
      </h3>

      {/* Status Badge */}
      <div className="flex gap-2 mb-4">
        {event.resolved ? (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            Resolved: {event.outcome ? 'YES' : 'NO'}
          </span>
        ) : isExpired ? (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            Awaiting Resolution
          </span>
        ) : (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Active
          </span>
        )}
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          {timeRemaining}
        </span>
      </div>

      {/* Pool Stats */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Total Pool</span>
          <span className="font-semibold">{totalPool.toFixed(2)} PYUSD</span>
        </div>
        
        {/* Yes/No Distribution */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-green-600 font-medium">YES</span>
              <span className="text-green-600">{yesPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${yesPercentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {totalYes.toFixed(2)} PYUSD
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-red-600 font-medium">NO</span>
              <span className="text-red-600">{noPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: `${noPercentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {totalNo.toFixed(2)} PYUSD
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {!event.resolved && !isExpired && (
        <button
          onClick={() => onBetClick?.(eventId)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Place Bet
        </button>
      )}

      {/* Creator Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
        <div>Created by: {event.creator.slice(0, 6)}...{event.creator.slice(-4)}</div>
      </div>
    </div>
  );
}
